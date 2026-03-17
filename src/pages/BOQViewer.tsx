import { useState } from 'react';

export const BOQViewer = () => {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="w-full h-[calc(100vh-8rem)] relative rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0B1121] z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Commercial Hub</p>
                    </div>
                </div>
            )}
            <iframe 
                src="/boq-viewer.html" 
                title="DEC BOQ Viewer"
                className="w-full h-full border-0 absolute inset-0 bg-white dark:bg-[#111111]"
                onLoad={() => setIsLoading(false)}
                allow="fullscreen"
            />
        </div>
    );
};
