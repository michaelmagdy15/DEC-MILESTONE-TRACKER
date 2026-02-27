import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
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

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
          }
        }

        localStorage.setItem('dec_app_version', latestVersion);
        window.location.reload();
        return;
      } else if (!currentVersion) {
        localStorage.setItem('dec_app_version', latestVersion);
      }
    }
  } catch (error) {
    console.warn("[Cache Buster] Failed to check app version:", error);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '600',
          },
          success: {
            iconTheme: { primary: '#f97316', secondary: '#fff' },
            duration: 2000,
          },
          error: {
            duration: 4000,
          },
        }}
      />
      <App />
    </StrictMode>,
  );
};

initApp();
