'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ledger_credential_id';
const SESSION_KEY = 'ledger_fp_auth';

function base64Encode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64Decode(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

function randomChallenge() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return buf;
}

async function registerFingerprint() {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: 'Itefaq Builders', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode('ledger-protected'),
        name: 'ledger-protected',
        displayName: 'Ledger User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
    },
  });
  const credId = base64Encode(credential.rawId);
  localStorage.setItem(STORAGE_KEY, credId);
}

async function verifyFingerprint(credId) {
  const credentialId = base64Decode(credId);
  await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      rpId: window.location.hostname,
      allowCredentials: [
        { type: 'public-key', id: credentialId, transports: ['internal'] },
      ],
      userVerification: 'required',
      timeout: 60000,
    },
  });
}

/**
 * FingerprintAuthModal
 *
 * Props:
 *   open       – boolean, controls visibility
 *   onSuccess  – called when fingerprint auth passes
 *   onCancel   – called when user dismisses/cancels
 */
export default function FingerprintAuthModal({ open, onSuccess, onCancel }) {
  const [status, setStatus] = useState('idle'); // idle | authenticating | error | unsupported
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // When modal opens, check support and auto-start auth
  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setError('');
      setIsRegistering(false);
      return;
    }

    // Already authenticated this session — skip prompt
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      onSuccess();
      return;
    }

    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        if (!available) {
          setStatus('unsupported');
        } else {
          // Auto-trigger auth as soon as modal opens
          triggerAuth();
        }
      })
      .catch(() => setStatus('unsupported'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const triggerAuth = async () => {
    setError('');
    setStatus('authenticating');
    try {
      const credId = localStorage.getItem(STORAGE_KEY);
      if (!credId) {
        setIsRegistering(true);
        await registerFingerprint();
        setIsRegistering(false);
      } else {
        await verifyFingerprint(credId);
      }
      sessionStorage.setItem(SESSION_KEY, 'true');
      onSuccess();
    } catch (e) {
      setIsRegistering(false);
      if (e.name === 'NotAllowedError') {
        setError('Fingerprint not matched or scan was cancelled.');
      } else {
        setError('Authentication failed: ' + (e.message || String(e)));
      }
      setStatus('error');
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setError('');
    setStatus('idle');
  };

  if (!open) return null;

  const hasCredential = typeof window !== 'undefined' && !!localStorage.getItem(STORAGE_KEY);

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full mx-4 text-center relative">

        {/* Fingerprint icon with spinner */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`w-10 h-10 transition-colors duration-300 ${
                  status === 'error' ? 'text-red-400' :
                  status === 'authenticating' ? 'text-blue-500' :
                  'text-blue-400'
                }`}
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1C8.1 1 5 4.1 5 8v1" />
                <path d="M19 9c0-3.9-3.1-7-7-7" />
                <path d="M12 21c-1.7 0-3-1.3-3-3V8c0-1.7 1.3-3 3-3s3 1.3 3 3v6" />
                <path d="M9 18v-2" />
                <path d="M15 14v4c0 1.7-1.3 3-3 3" />
                <path d="M6 9c0 3.3 2.7 6 6 6" />
                <path d="M18 9c0 1.8-.5 3.4-1.4 4.8" />
              </svg>
            </div>
            {status === 'authenticating' && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">
          {status === 'unsupported' ? 'Not Supported' : 'Fingerprint Required'}
        </h2>

        {status === 'unsupported' ? (
          <p className="text-sm text-gray-500 mb-5">
            Your device or browser does not support fingerprint authentication.
            Please use Chrome, Edge, or Safari on a device with a fingerprint sensor.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {status === 'authenticating'
                ? isRegistering
                  ? 'Setting up your fingerprint — follow the on-screen prompt...'
                  : 'Scan your fingerprint to continue...'
                : !hasCredential
                  ? 'First time: your fingerprint will be registered.'
                  : 'Verify your fingerprint to add a ledger entry.'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4 text-red-600 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={triggerAuth}
              disabled={status === 'authenticating'}
              className="w-full py-2.5 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow mb-2"
            >
              {status === 'authenticating'
                ? isRegistering ? 'Registering...' : 'Scanning...'
                : hasCredential ? 'Scan Fingerprint' : 'Set Up Fingerprint'}
            </button>

            <button
              onClick={onCancel}
              disabled={status === 'authenticating'}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>

            {hasCredential && status !== 'authenticating' && (
              <button
                onClick={handleReset}
                className="mt-3 text-xs text-gray-300 hover:text-gray-400 underline transition-colors"
              >
                Reset fingerprint registration
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
