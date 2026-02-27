import React from 'react';
import clsx from 'clsx';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ElementType;
    loading?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading,
    className,
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-orange-500 text-white shadow-orange-glow hover:shadow-orange-glow-strong hover:bg-orange-400',
        secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
        outline: 'bg-transparent border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500',
        ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5',
        danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
    };

    return (
        <button
            disabled={disabled || loading}
            className={clsx(
                'relative inline-flex items-center justify-center font-bold font-mono tracking-wider uppercase rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none group overflow-hidden',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {/* Background Shine Effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

            {loading ? (
                <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin mr-2" />
            ) : Icon ? (
                <Icon className={clsx('w-4 h-4 transition-transform group-hover:scale-110', children ? 'mr-2' : '')} />
            ) : null}

            <span className="relative z-10">{children}</span>
        </button>
    );
};
