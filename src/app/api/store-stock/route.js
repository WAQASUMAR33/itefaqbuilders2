import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  getStoreStock, 
  updateStoreStock, 
  getStoreStockSummary, 
  getLowStockProducts,
  transferStock 
} from '@/lib/storeStock';

// GET - Get store stock information
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    // Support both pro_id and product_id for backward compatibility
    const productId = searchParams.get('product_id') || searchParams.get('pro_id');
    const lowStock = searchParams.get('low_stock');

    // Get specific product stock in a store
    if (storeId && productId) {
      const stock = await getStoreStock(parseInt(storeId), parseInt(productId));
      return NextResponse.json({ 
        store_id: parseInt(storeId), 
        product_id: parseInt(productId), 
        stock_quantity: stock 
      });
    }

    // Get low stock products for a store
    if (storeId && lowStock === 'true') {
      const lowStockProducts = await getLowStockProducts(parseInt(storeId));
      return NextResponse.json(lowStockProducts);
    }

    // Get all stock for a store
    if (storeId) {
      const storeStock = await getStoreStockSummary(parseInt(storeId));
      return NextResponse.json(storeStock);
    }

    // Get all stores and their stock
    // Use raw SQL if storeStock model not available, otherwise use Prisma query
    let stores;
    if (prisma.store && prisma.store.findMany) {
      // Try using Prisma relation
      try {
        stores = await prisma.store.findMany({
          include: {
            storeStocks: {
              include: {
                product: {
                  select: {
                    pro_id: true,
                    pro_title: true,
                    pro_unit: true
                  }
                }
              }
            }
          }
        });
      } catch (e) {
        // Fallback to raw SQL if relation doesn't work
        const rows = await prisma.$queryRaw`
          SELECT
            s.storeid, s.store_name, s.store_address,
            ss.store_stock_id, ss.pro_id, ss.stock_quantity, ss.min_stock,
            p.pro_id as product_pro_id,
            p.pro_title as product_pro_title,
            p.pro_unit as product_pro_unit,
            p.pro_cost_price as product_pro_cost_price,
            p.pro_sale_price as product_pro_sale_price,
            c.cat_name as product_cat_name
          FROM stores s
          LEFT JOIN store_stocks ss ON s.storeid = ss.store_id
          LEFT JOIN products p ON ss.pro_id = p.pro_id
          LEFT JOIN categories c ON p.cat_id = c.cat_id
          WHERE ss.pro_id IS NOT NULL
          ORDER BY s.storeid, p.pro_title
        `;
        // Group by store
        stores = rows.reduce((acc, row) => {
          const storeId = row.storeid;
          let store = acc.find(s => s.storeid === storeId);
          if (!store) {
            store = { storeid: row.storeid, store_name: row.store_name, store_stocks: [] };
            acc.push(store);
          }
          if (row.store_stock_id) {
            store.store_stocks.push({
              store_stock_id: row.store_stock_id,
              store_id: row.storeid,
              pro_id: row.pro_id,
              stock_quantity: row.stock_quantity,
              min_stock: row.min_stock,
              product: {
                pro_id: row.product_pro_id,
                pro_title: row.product_pro_title,
                pro_unit: row.product_pro_unit,
                pro_cost_price: row.product_pro_cost_price,
                pro_sale_price: row.product_pro_sale_price,
                cat_name: row.product_cat_name
              }
            });
          }
          return acc;
        }, []);
      }
    } else {
      // Raw SQL fallback
      const rows = await prisma.$queryRaw`
        SELECT
          s.storeid, s.store_name, s.store_address,
          ss.store_stock_id, ss.pro_id, ss.stock_quantity, ss.min_stock,
          p.pro_id as product_pro_id,
          p.pro_title as product_pro_title,
          p.pro_unit as product_pro_unit,
          p.pro_cost_price as product_pro_cost_price,
          p.pro_sale_price as product_pro_sale_price,
          c.cat_name as product_cat_name
        FROM stores s
        LEFT JOIN store_stocks ss ON s.storeid = ss.store_id
        LEFT JOIN products p ON ss.pro_id = p.pro_id
        LEFT JOIN categories c ON p.cat_id = c.cat_id
        WHERE ss.pro_id IS NOT NULL
        ORDER BY s.storeid, p.pro_title
      `;
      // Group by store
      stores = rows.reduce((acc, row) => {
        const storeId = row.storeid;
        let store = acc.find(s => s.storeid === storeId);
        if (!store) {
          store = { storeid: row.storeid, store_name: row.store_name, store_stocks: [] };
          acc.push(store);
        }
        if (row.store_stock_id) {
          store.store_stocks.push({
            store_stock_id: row.store_stock_id,
            store_id: row.storeid,
            pro_id: row.pro_id,
            stock_quantity: row.stock_quantity,
            min_stock: row.min_stock,
            product: {
              pro_id: row.product_pro_id,
              pro_title: row.product_pro_title,
              pro_unit: row.product_pro_unit,
              pro_cost_price: row.product_pro_cost_price,
              pro_sale_price: row.product_pro_sale_price,
              cat_name: row.product_cat_name
            }
          });
        }
        return acc;
      }, []);
    }

    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching store stock:', error);
    return NextResponse.json({ error: 'Failed to fetch store stock' }, { status: 500 });
  }
}

// POST - Update store stock
export async function POST(request) {
  try {
    const body = await request.json();
    const { store_id, product_id, quantity, operation = 'set', updated_by } = body;

    if (!store_id || !product_id || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedStock = await updateStoreStock(
      parseInt(store_id), 
      parseInt(product_id), 
      parseInt(quantity), 
      operation, 
      updated_by
    );

    return NextResponse.json({
      success: true,
      message: 'Store stock updated successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Error updating store stock:', error);
    return NextResponse.json({ error: 'Failed to update store stock' }, { status: 500 });
  }
}

// PUT - Transfer stock between stores
export async function PUT(request) {
  try {
    const body = await request.json();
    const { from_store_id, to_store_id, product_id, quantity, updated_by } = body;

    if (!from_store_id || !to_store_id || !product_id || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await transferStock(
      parseInt(from_store_id),
      parseInt(to_store_id),
      parseInt(product_id),
      parseInt(quantity),
      updated_by
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error transferring stock:', error);
    return NextResponse.json({ error: 'Failed to transfer stock' }, { status: 500 });
  }
}

