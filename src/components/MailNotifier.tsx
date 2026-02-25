import { useEffect, useRef, useState } from 'react';
import { getValidAccessToken, fetchZohoAccounts, fetchZohoEmails, ZOHO_TOKENS_KEYS } from '../lib/zoho';
import { BellRing, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Safely check if browser Notification API is available
const hasNotificationAPI = typeof window !== 'undefined' && 'Notification' in window;

export const MailNotifier = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const latestMessageIdRef = useRef<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            if (hasNotificationAPI && Notification.permission === 'default') {
                setShowPrompt(true);
            }
        } catch { /* Notification API not available */ }

        // Don't poll if user has never connected Zoho (no tokens stored)
        const hasTokens = localStorage.getItem(ZOHO_TOKENS_KEYS.REFRESH);
        if (!hasTokens) return;

        const checkEmails = async () => {
            try {
                const token = await getValidAccessToken();
                if (!token) return;

                const accounts = await fetchZohoAccounts(token);
                if (!accounts || accounts.length === 0) return;

                const emails = await fetchZohoEmails(token, accounts[0].accountId, 5);
                if (emails && emails.length > 0) {
                    const latestEmail = emails[0];

                    if (!latestMessageIdRef.current) {
                        latestMessageIdRef.current = latestEmail.messageId;
                        return;
                    }

                    if (latestEmail.messageId !== latestMessageIdRef.current) {
                        latestMessageIdRef.current = latestEmail.messageId;
                        triggerNotification(latestEmail.sender, latestEmail.subject);
                    }
                }
            } catch (err) {
                // Silently ignore polling errors — don't crash the app
                console.warn('Mail Notifier: polling skipped', err);
            }
        };

        // Poll every 60 seconds (less aggressive to reduce load)
        const interval = setInterval(checkEmails, 60000);
        // Initial check after 5s delay to let the app settle
        const initialDelay = setTimeout(checkEmails, 5000);

        return () => { clearInterval(interval); clearTimeout(initialDelay); };
    }, []);

    const playSound = () => {
        try {
            // Create a short beep sound using the Web Audio API
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
            oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.5, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(context.destination);

            oscillator.start();
            oscillator.stop(context.currentTime + 0.5);
        } catch (e) {
            console.warn("Audio play failed", e);
        }
    };

    const triggerNotification = (sender: string, subject: string) => {
        playSound();

        try {
            if (hasNotificationAPI && Notification.permission === 'granted') {
                const notif = new Notification('New Email Received', {
                    body: `From: ${sender}\n${subject || 'No Subject'}`,
                    icon: '/favicon.ico',
                });

                notif.onclick = () => {
                    window.focus();
                    // Use SPA navigation — NOT window.location.assign which causes full reload
                    navigate('/emails');
                    notif.close();
                };
            }
        } catch (err) {
            console.warn('Notification error:', err);
        }
    };

    const requestPermission = async () => {
        try {
            if (hasNotificationAPI) await Notification.requestPermission();
        } catch { /* ignore */ }
        setShowPrompt(false);
    };

    if (showPrompt) {
        return (
            <div className="fixed bottom-6 right-6 z-50 bg-[#141414] border border-orange-500/30 p-4 rounded-xl shadow-[0_10px_40px_rgba(249,115,22,0.15)] max-w-sm border-l-4 border-l-orange-500 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
                <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500 mt-1">
                    <BellRing className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-semibold text-white mb-1">Enable Mail Notifications?</h4>
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                        Allow desktop notifications to instantly alert you when a new Zoho email arrives.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={requestPermission}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            Allow
                        </button>
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
                <button onClick={() => setShowPrompt(false)} className="absolute top-2 right-2 text-slate-500 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return null;
};
