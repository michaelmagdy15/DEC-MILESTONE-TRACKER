import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface EditableTextProps {
    settingKey?: string;
    defaultText: string;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
    onSave?: (newValue: string) => Promise<void>;
}

export const EditableText: React.FC<EditableTextProps> = ({
    settingKey,
    defaultText,
    className = '',
    as: Component = 'span',
    onSave
}) => {
    const { role } = useAuth();
    const { globalSettings, updateGlobalSetting } = useData();
    const isAdmin = role === 'admin';

    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Get the current text (from settings or default)
    const currentText = (settingKey ? globalSettings[settingKey] : undefined) || defaultText;

    useEffect(() => {
        setValue(currentText);
    }, [currentText]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (value.trim() !== '' && value !== currentText) {
            try {
                if (onSave) {
                    await onSave(value.trim());
                } else if (settingKey) {
                    await updateGlobalSetting(settingKey, value.trim());
                }
            } catch (err) {
                console.error("Failed to save edited text:", err);
            }
        } else {
            setValue(currentText); // Reset if empty
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setValue(currentText);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    if (!isAdmin) {
        return <Component className={className}>{currentText}</Component>;
    }

    if (isEditing) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full max-w-sm"
                />
                <button
                    onClick={handleSave}
                    className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className={`group flex items-center gap-2 cursor-pointer ${className}`} onClick={() => setIsEditing(true)}>
            <Component className="border-b border-transparent group-hover:border-slate-500 border-dashed transition-colors">
                {currentText}
            </Component>
            <Edit2 size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};
