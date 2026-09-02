export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] SW registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('[App] SW registration failed:', error);
        });
    });
  } else {
    console.log('[App] Service Workers not supported');
  }
}