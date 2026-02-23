import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Folder, X, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { Project } from '../types';
import { motion } from 'framer-motion';

export const Projects: React.FC = () => {
    const { projects, addProject, updateProject, deleteProject } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const projectData: Project = {
            id: editingId || crypto.randomUUID(),
            name,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        };

        if (editingId) {
            updateProject(projectData);
        } else {
            addProject(projectData);
        }

        resetForm();
    };

    const startEdit = (project: Project) => {
        setEditingId(project.id);
        setName(project.name);
        setHourlyRate(project.hourlyRate?.toString() || '');
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setHourlyRate('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            deleteProject(id);
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
                <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Project</span>
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 ring-1 ring-blue-500/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                            {editingId ? 'Edit Project' : 'New Project'}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="e.g. Villa Design"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hourly Rate (Optional)</label>
                                <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
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
                                <span>Save Project</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                        <Folder className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No projects yet</p>
                        <p className="text-slate-400 text-sm">Create your first project to get started</p>
                    </div>
                )}

                {projects.map((project) => (
                    <div key={project.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                                <Folder className="w-6 h-6" />
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(project)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(project.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900 mb-1">{project.name}</h3>
                        {project.hourlyRate && (
                            <p className="text-slate-500 text-sm mb-4">
                                <span className="font-medium text-slate-700">${project.hourlyRate.toFixed(2)}</span> / hour
                            </p>
                        )}
                        <button
                            onClick={() => window.location.href = `/projects/${project.id}`}
                            className="w-full mt-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                        >
                            View Board & Tasks
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
