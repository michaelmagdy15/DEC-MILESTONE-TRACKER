import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-8">
                    <div className="max-w-lg w-full bg-[#1a1a1a]/60 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-2xl p-10 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                            Something went wrong
                        </h2>
                        <p className="text-slate-500 font-medium mb-6 text-sm leading-relaxed">
                            An unexpected error occurred. This has been logged for investigation.
                        </p>
                        {this.state.error && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 mb-6 text-left">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 font-bold uppercase tracking-widest text-[11px]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
