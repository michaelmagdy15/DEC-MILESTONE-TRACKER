import { useEffect, useRef, useState } from 'react';
import { getValidAccessToken, fetchZohoAccounts, fetchZohoEmails, ZOHO_TOKENS_KEYS } from '../lib/zoho';
import { BellRing, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

        // Poll every 15 seconds for a more real-time feel
        const interval = setInterval(checkEmails, 15000);
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

        // Dispatch custom event to notify Emails.tsx to refresh
        window.dispatchEvent(new CustomEvent('new-email'));

        let shownNative = false;

        try {
            if (hasNotificationAPI && Notification.permission === 'granted') {
                const notif = new Notification('New Email Received', {
                    body: `From: ${sender}\n${subject || 'No Subject'}`,
                    icon: '/favicon.ico',
                });

                notif.onclick = () => {
                    window.focus();
                    navigate('/emails');
                    notif.close();
                };
                shownNative = true;
            }
        } catch (err) {
            console.warn('Native Notification error:', err);
        }

        // Fallback or guaranteed visual toast if native notification wasn't shown
        if (!shownNative) {
            toast.custom(
                (t) => (
                    <div
                        className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                        max-w-md w-full bg-[#1a1a1a] shadow-[0_10px_40px_rgba(249,115,22,0.2)] rounded-2xl pointer-events-auto flex ring-1 ring-orange-500/20 border border-orange-500/30 overflow-hidden cursor-pointer backdrop-blur-3xl`}
                        onClick={() => {
                            toast.dismiss(t.id);
                            navigate('/emails');
                        }}
                    >
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 pt-0.5">
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                                        <BellRing className="w-5 h-5 text-orange-400" />
                                    </div>
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-black text-white uppercase tracking-wider">New Email Received</p>
                                    <p className="mt-1 text-sm text-slate-400 truncate w-[200px]">From: {sender}</p>
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{subject || 'No Subject'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-white/5">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toast.dismiss(t.id);
                                }}
                                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ),
                { duration: 8000, position: 'top-right' }
            );
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
