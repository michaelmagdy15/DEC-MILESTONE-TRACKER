
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Users, X, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Engineer } from '../types';
import { motion } from 'framer-motion';

export const Engineers = () => {
    const { engineers, addEngineer, updateEngineer, deleteEngineer } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState('Engineer');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const engineerData: Engineer = {
            id: editingId || crypto.randomUUID(),
            name,
            role,
        };

        if (editingId) {
            updateEngineer(engineerData);
        } else {
            addEngineer(engineerData);
        }

        resetForm();
    };

    const startEdit = (engineer: Engineer) => {
        setEditingId(engineer.id);
        setName(engineer.name);
        setRole(engineer.role || 'Engineer');
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setRole('Engineer');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this engineer?')) {
            deleteEngineer(id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Engineers</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Engineer</span>
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 ring-1 ring-blue-500/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                            {editingId ? 'Edit Engineer' : 'New Engineer'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Engineer Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                placeholder="e.g. John Doe"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            >
                                <option value="Engineer">Engineer</option>
                                <option value="Senior Engineer">Senior Engineer</option>
                                <option value="Architect">Architect</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Draftsman">Draftsman</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-sm"
                            >
                                <Check className="w-4 h-4" />
                                <span>Save Engineer</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {engineers.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No engineers yet</p>
                        <p className="text-slate-400 text-sm">Add your team members to get started</p>
                    </div>
                )}

                {engineers.map((engineer) => (
                    <div key={engineer.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold text-lg text-slate-900">{engineer.name}</h3>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    {engineer.role || 'Engineer'}
                                </span>
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(engineer)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(engineer.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
