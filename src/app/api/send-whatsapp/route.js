/**
 * POST /api/send-whatsapp
 *
 * Sends a PDF invoice to a customer via WhatsApp Business (Meta Cloud API).
 *
 * Body (JSON):
 *   phone      - customer phone in any format (03XXXXXXXXX or +923XXXXXXXXX)
 *   pdfBase64  - base64-encoded PDF string
 *   filename   - e.g. "invoice-312.pdf"
 *   caption    - message shown with the document
 */

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/** Normalize Pakistani numbers to international format without + */
function normalizePhone(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '92' + digits.slice(1);
  return digits;
}

/** Upload the PDF to WhatsApp media and return the media ID */
async function uploadMedia(pdfBuffer, filename) {
  const formData = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('file', blob, filename);
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'application/pdf');

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
      body: formData,
    }
  );

  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(data?.error?.message || 'Media upload failed');
  }
  return data.id;
}

/** Send the uploaded media as a document message */
async function sendDocument(phone, mediaId, filename, caption) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'document',
        document: {
          id: mediaId,
          filename,
          caption,
        },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Message send failed');
  }
  return data;
}

export async function POST(request) {
  try {
    if (!WA_TOKEN || !WA_PHONE_ID) {
      return Response.json(
        { error: 'WhatsApp API not configured. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env' },
        { status: 500 }
      );
    }

    const { phone, pdfBase64, filename = 'invoice.pdf', caption = 'Please find your invoice attached.' } =
      await request.json();

    if (!phone) return Response.json({ error: 'phone is required' }, { status: 400 });
    if (!pdfBase64) return Response.json({ error: 'pdfBase64 is required' }, { status: 400 });

    const normalizedPhone = normalizePhone(phone);
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const mediaId = await uploadMedia(pdfBuffer, filename);
    const result = await sendDocument(normalizedPhone, mediaId, filename, caption);

    return Response.json({ success: true, messageId: result?.messages?.[0]?.id });
  } catch (err) {
    console.error('[send-whatsapp]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
