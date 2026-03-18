import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SystemHint = ({ title, children }: { title?: string, children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 relative group"
                >
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="absolute top-2 right-2 p-1.5 text-indigo-400/50 hover:text-indigo-400 bg-white/0 hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex gap-3">
                        <div className="mt-0.5 text-indigo-400 flex-shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div className="pr-6">
                            <h4 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-1.5">
                                {title || "How System Works"}
                            </h4>
                            <div className="text-xs text-indigo-200/70 leading-relaxed font-medium space-y-1">
                                {children}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
