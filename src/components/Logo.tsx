import React from 'react';
import clsx from 'clsx';
import logoSrc from '../assets/logo.png';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <img
            src={logoSrc}
            alt="DEC Engineering Consultant"
            className={clsx("h-auto w-auto max-h-20 object-contain", className)}
        />
    );
};
