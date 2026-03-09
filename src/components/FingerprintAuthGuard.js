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

export default function FingerprintAuthGuard({ children }) {
  // states: 'checking' | 'unsupported' | 'locked' | 'authenticating' | 'authenticated'
  const [state, setState] = useState('checking');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);

  useEffect(() => {
    setHasCredential(!!localStorage.getItem(STORAGE_KEY));
    // Already authed this browser session — skip prompt
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setState('authenticated');
      return;
    }
    // Check platform biometric support
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => setState(available ? 'locked' : 'unsupported'))
      .catch(() => setState('unsupported'));
  }, []);

  const handleAuth = async () => {
    setError('');
    setState('authenticating');
    try {
      const credId = localStorage.getItem(STORAGE_KEY);
      if (!credId) {
        setIsRegistering(true);
        await registerFingerprint();
        setIsRegistering(false);
        setHasCredential(true);
      } else {
        await verifyFingerprint(credId);
      }
      sessionStorage.setItem(SESSION_KEY, 'true');
      setState('authenticated');
    } catch (e) {
      setIsRegistering(false);
      if (e.name === 'NotAllowedError') {
        setError('Fingerprint not matched or scan cancelled. Please try again.');
      } else {
        setError('Authentication failed: ' + (e.message || String(e)));
      }
      setState('locked');
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setHasCredential(false);
    setError('');
    setState('locked');
  };

  if (state === 'authenticated') return children;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center text-white">

        {/* Lock Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/30">
              {/* Fingerprint SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="w-12 h-12 text-blue-300" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1C8.1 1 5 4.1 5 8v1" />
                <path d="M19 9c0-3.9-3.1-7-7-7" />
                <path d="M12 21c-1.7 0-3-1.3-3-3V8c0-1.7 1.3-3 3-3s3 1.3 3 3v6" />
                <path d="M9 18v-2" />
                <path d="M15 14v4c0 1.7-1.3 3-3 3" />
                <path d="M6 9c0 3.3 2.7 6 6 6" />
                <path d="M18 9c0 1.8-.5 3.4-1.4 4.8" />
              </svg>
            </div>
            {state === 'authenticating' && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          {state === 'unsupported' ? 'Biometrics Not Available' : 'Protected Page'}
        </h1>

        {state === 'unsupported' ? (
          <>
            <p className="text-white/70 text-sm mb-6">
              Fingerprint authentication is not supported on this device or browser.
              Please use a device with a fingerprint sensor and a supported browser (Chrome, Edge, Safari).
            </p>
          </>
        ) : (
          <>
            <p className="text-white/70 text-sm mb-2">
              {state === 'authenticating'
                ? isRegistering
                  ? 'Setting up fingerprint — follow the on-screen prompt...'
                  : 'Verifying fingerprint — follow the on-screen prompt...'
                : 'Customer Ledger is protected. Verify your fingerprint to continue.'}
            </p>

            {!hasCredential && state === 'locked' && (
              <p className="text-yellow-300 text-xs mb-4">
                First time? Your fingerprint will be registered for future access.
              </p>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 mb-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={state === 'authenticating'}
              className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/40 mb-3"
            >
              {state === 'authenticating'
                ? isRegistering ? 'Registering...' : 'Verifying...'
                : hasCredential ? 'Scan Fingerprint' : 'Set Up Fingerprint'}
            </button>

            {hasCredential && state === 'locked' && (
              <button
                onClick={handleReset}
                className="text-xs text-white/40 hover:text-white/60 underline transition-colors"
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
