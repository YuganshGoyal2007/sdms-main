import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PWAStatus {
  https: boolean;
  manifest: boolean;
  manifestDetails: any;
  serviceWorker: boolean;
  swState: string;
  icons: boolean;
  installPrompt: boolean;
}

const PWADebugger: React.FC = () => {
  const [status, setStatus] = useState<PWAStatus>({
    https: false,
    manifest: false,
    manifestDetails: null,
    serviceWorker: false,
    swState: 'none',
    icons: false,
    installPrompt: false
  });
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    checkPWAStatus();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', () => {
      setStatus(prev => ({ ...prev, installPrompt: true }));
    });
  }, []);

  const checkPWAStatus = async () => {
    const newStatus: PWAStatus = {
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      manifest: false,
      manifestDetails: null,
      serviceWorker: false,
      swState: 'none',
      icons: false,
      installPrompt: false
    };

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      try {
        const response = await fetch(manifestLink.href);
        const manifest = await response.json();
        newStatus.manifest = true;
        newStatus.manifestDetails = manifest;
        newStatus.icons = manifest.icons && 
          manifest.icons.some((i: any) => i.sizes === '192x192') &&
          manifest.icons.some((i: any) => i.sizes === '512x512');
      } catch (e) {
        console.error('Manifest error:', e);
      }
    }

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          newStatus.serviceWorker = true;
          newStatus.swState = registration.active?.state || 'installing';
        }
      } catch (e) {
        console.error('SW error:', e);
      }
    }

    setStatus(newStatus);
  };

  const StatusItem = ({ label, checked }: { label: string; checked: boolean }) => (
    <div className="flex items-center gap-2 py-1">
      {checked ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
      <span className={checked ? 'text-green-700' : 'text-red-700'}>{label}</span>
    </div>
  );

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowDebugger(!showDebugger)}
        className="fixed bottom-4 left-4 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 hover:bg-purple-700"
      >
        PWA Debug
      </button>

      {/* Debugger Panel */}
      {showDebugger && (
        <div className="fixed bottom-16 left-4 bg-white border-2 border-purple-600 rounded-lg shadow-xl p-4 z-50 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">PWA Status</h3>
            <button
              onClick={() => setShowDebugger(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 text-sm">
            <StatusItem label="HTTPS/Localhost" checked={status.https} />
            <StatusItem label="Manifest Found" checked={status.manifest} />
            <StatusItem label="Icons (192 & 512)" checked={status.icons} />
            <StatusItem label="Service Worker" checked={status.serviceWorker} />
            
            {status.serviceWorker && (
              <div className="pl-7 text-xs text-gray-600">
                State: {status.swState}
              </div>
            )}
            
            <StatusItem label="Install Prompt Ready" checked={status.installPrompt} />
          </div>

          {status.installPrompt && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              ✓ Install prompt is available! Wait for it to appear or check address bar.
            </div>
          )}

          {!status.installPrompt && status.https && status.manifest && status.serviceWorker && status.icons && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              All requirements met. Wait 30s or check address bar for install icon.
            </div>
          )}

          <button
            onClick={checkPWAStatus}
            className="mt-3 w-full bg-purple-600 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-700"
          >
            Refresh Status
          </button>
        </div>
      )}
    </>
  );
};

export default PWADebugger;