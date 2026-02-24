import { useEffect, useState } from 'react';
import { Mail, RefreshCw, LogIn, ExternalLink, Inbox, Send, AlertCircle } from 'lucide-react';
import {
    getZohoAuthUrl,
    exchangeCodeForTokens,
    getValidAccessToken,
    fetchZohoAccounts,
    fetchZohoEmails,
    saveZohoTokens,
    clearZohoTokens,
    type ZohoMailAccount
} from '../lib/zoho';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const Emails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [accounts, setAccounts] = useState<ZohoMailAccount[]>([]);
    const [emails, setEmails] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check if we are handling an OAuth callback
        const code = searchParams.get('code');
        if (code) {
            handleOAuthCallback(code);
        } else {
            checkAuthStatus();
        }
    }, [searchParams]);

    const handleOAuthCallback = async (code: string) => {
        try {
            setIsLoading(true);
            const tokens = await exchangeCodeForTokens(code);
            if (tokens.error) throw new Error(tokens.error);

            saveZohoTokens(tokens);
            setIsConnected(true);

            // Clean up URL
            navigate('/emails', { replace: true });

            // Fetch data now that we're connected
            await loadEmails();
        } catch (err: any) {
            setError(err.message || 'Failed to authenticate with Zoho');
            clearZohoTokens();
        } finally {
            setIsLoading(false);
        }
    };

    const checkAuthStatus = async () => {
        try {
            setIsLoading(true);
            const token = await getValidAccessToken();
            if (token) {
                setIsConnected(true);
                await loadEmails(token);
            } else {
                setIsConnected(false);
            }
        } catch (err) {
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const loadEmails = async (providedToken?: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const token = providedToken || await getValidAccessToken();
            if (!token) throw new Error('Not authenticated');

            const userAccounts = await fetchZohoAccounts(token);
            setAccounts(userAccounts);

            if (userAccounts.length > 0) {
                const primaryAccountId = userAccounts[0].accountId;
                const recentEmails = await fetchZohoEmails(token, primaryAccountId);
                setEmails(recentEmails || []);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch emails');
            if (err.message?.includes('Not authenticated') || err.message?.includes('token')) {
                setIsConnected(false);
                clearZohoTokens();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = () => {
        window.location.href = getZohoAuthUrl();
    };

    const handleDisconnect = () => {
        clearZohoTokens();
        setIsConnected(false);
        setAccounts([]);
        setEmails([]);
    };

    const formatEmailDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(parseInt(dateString));
        if (isNaN(date.getTime())) return dateString; // fallback

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };

    if (isLoading && !emails.length) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Loading Mailbox...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#141414] p-6 rounded-2xl border border-white/5">
                <div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-wider">Company Mail</h1>
                    <p className="text-slate-400 mt-1">Access your Zoho emails directly from the dashboard.</p>
                </div>

                {isConnected ? (
                    <div className="flex items-center gap-4">
                        {accounts.length > 0 && (
                            <div className="text-sm border border-orange-500/20 bg-orange-500/10 text-orange-400 px-4 py-2 rounded-lg">
                                <span className="opacity-70 mr-2">Account:</span>
                                <span className="font-semibold">{accounts[0].primaryEmailAddress}</span>
                            </div>
                        )}
                        <button
                            onClick={() => loadEmails()}
                            className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="Refresh Emails"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin opacity-50' : ''}`} />
                        </button>
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer text-sm font-semibold uppercase tracking-wider"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20 cursor-pointer"
                    >
                        <LogIn className="w-5 h-5" />
                        Connect Zoho Mail
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Main Content Area */}
            {isConnected && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar / Folders */}
                    <div className="lg:col-span-1 space-y-2">
                        <div className="bg-[#141414] rounded-2xl border border-white/5 p-4 space-y-1">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500/10 text-orange-500 rounded-xl font-medium transition-all cursor-pointer">
                                <Inbox className="w-5 h-5" />
                                Inbox
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 rounded-xl font-medium transition-all cursor-pointer disabled:opacity-50" disabled>
                                <Send className="w-5 h-5" />
                                Sent
                            </button>

                            <div className="my-4 border-t border-white/5 pt-4">
                                <a
                                    href="https://mail.zoho.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-slate-500 hover:text-orange-400 rounded-xl font-medium transition-colors cursor-pointer"
                                >
                                    <span className="flex items-center gap-3"><ExternalLink className="w-5 h-5" /> Open in Zoho</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Email List */}
                    <div className="lg:col-span-3 bg-[#141414] rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-[500px]">
                        {emails.length === 0 && !isLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
                                <Mail className="w-16 h-16 opacity-20 mb-4" />
                                <h3 className="text-xl font-medium text-white mb-2">Inbox Empty</h3>
                                <p>You have no emails to show right now.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {emails.map((email: any) => {
                                    const isUnread = email.status === '1'; // In Zoho, 1 often means unread, depending on API. Let's assume field exists.
                                    return (
                                        <div
                                            key={email.messageId}
                                            className={`p-4 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${isUnread ? 'bg-orange-500/5' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-orange-400 font-bold text-lg uppercase">
                                                    {email.sender ? email.sender.substring(0, 1) : '?'}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className={`truncate font-medium ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                                        {email.sender}
                                                    </h3>
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                                        {formatEmailDate(email.receivedTime)}
                                                    </span>
                                                </div>
                                                <h4 className={`text-sm truncate mb-1 ${isUnread ? 'text-slate-300 font-medium' : 'text-slate-400'}`}>
                                                    {email.subject || '(No Subject)'}
                                                </h4>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {email.summary || '...'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!isConnected && !isLoading && (
                <div className="bg-[#141414] rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 border-4 border-orange-500/20 flex items-center justify-center mb-6">
                        <Mail className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Integrate Zoho Mail</h2>
                    <p className="text-slate-400 max-w-lg mb-8">
                        Connect your company's Zoho Mail account to securely access your inbox,
                        receive real-time desktop notifications, and manage communications directly from the Milestone Tracker.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-orange-500/20 cursor-pointer"
                    >
                        Authorize Access
                    </button>
                </div>
            )}
        </div>
    );
};
