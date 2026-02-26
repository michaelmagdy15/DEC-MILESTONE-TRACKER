import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const initApp = async () => {
  try {
    // Bust caching by appending current timestamp
    const res = await fetch(`/version.json?t=${new Date().getTime()}`, {
      cache: "no-store",
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const latestVersion = data.version;
      const currentVersion = localStorage.getItem('dec_app_version');

      if (currentVersion && currentVersion !== latestVersion) {
        console.log(`[Cache Buster] New version detected (${latestVersion}). Clearing cache...`);

        // Clear API/HTTP caches if Service Worker / Cache API is used (keeps localStorage safe for Auth)
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
          }
        }

        // Update version and hard reload
        localStorage.setItem('dec_app_version', latestVersion);
        window.location.reload();
        return; // Stop rendering this stale version
      } else if (!currentVersion) {
        // First time loading the app with versioning
        localStorage.setItem('dec_app_version', latestVersion);
      }
    }
  } catch (error) {
    console.warn("[Cache Buster] Failed to check app version:", error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

initApp();
