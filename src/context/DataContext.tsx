import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Engineer, LogEntry, AttendanceRecord } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
    projects: Project[];
    engineers: Engineer[];
    entries: LogEntry[];
    attendance: AttendanceRecord[];
    addProject: (project: Project) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    addEngineer: (engineer: Engineer) => Promise<void>;
    updateEngineer: (engineer: Engineer) => Promise<void>;
    deleteEngineer: (id: string) => Promise<void>;
    addEntry: (entry: LogEntry) => Promise<void>;
    updateEntry: (entry: LogEntry) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    addAttendance: (record: AttendanceRecord) => Promise<void>;
    updateAttendance: (record: AttendanceRecord) => Promise<void>;
    deleteAttendance: (id: string) => Promise<void>;
    isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [projectsRes, engineersRes, entriesRes, attendanceRes] = await Promise.all([
                supabase.from('projects').select('*').order('created_at', { ascending: false }),
                supabase.from('engineers').select('*').order('created_at', { ascending: false }),
                supabase.from('entries').select('*').order('date', { ascending: false }),
                supabase.from('attendance').select('*').order('date', { ascending: false })
            ]);

            if (projectsRes.error) throw projectsRes.error;
            if (engineersRes.error) throw engineersRes.error;
            if (entriesRes.error) throw entriesRes.error;
            if (attendanceRes.error) throw attendanceRes.error;

            setProjects(projectsRes.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                hourlyRate: p.hourly_rate
            })));

            setEngineers(engineersRes.data.map((e: any) => ({
                id: e.id,
                name: e.name,
                role: e.role,
                hourlyRate: e.hourly_rate,
                weeklyGoalHours: e.weekly_goal_hours
            })));

            setEntries(entriesRes.data.map((e: any) => ({
                id: e.id,
                projectId: e.project_id,
                engineerId: e.engineer_id,
                date: e.date,
                taskDescription: e.task_description,
                softwareUsed: e.software_used || [],
                timeSpent: e.time_spent,
                milestone: e.milestone
            })));

            setAttendance(attendanceRes.data.map((a: any) => ({
                id: a.id,
                engineerId: a.engineer_id,
                date: a.date,
                status: a.status
            })));

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data from database');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const channels = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'projects' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'engineers' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'entries' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance' },
                () => { fetchData() }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, []);

    // Projects
    const addProject = async (project: Project) => {
        const { error } = await supabase.from('projects').insert({
            id: project.id,
            name: project.name,
            hourly_rate: project.hourlyRate
        });
        if (error) {
            console.error('Error adding project:', error);
            alert('Failed to add project');
        }
    };

    const updateProject = async (project: Project) => {
        const { error } = await supabase.from('projects').update({
            name: project.name,
            hourly_rate: project.hourlyRate
        }).eq('id', project.id);

        if (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project');
        }
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project');
        }
    };

    // Engineers
    const addEngineer = async (engineer: Engineer) => {
        const { error } = await supabase.from('engineers').insert({
            id: engineer.id,
            name: engineer.name,
            role: engineer.role,
            hourly_rate: engineer.hourlyRate,
            weekly_goal_hours: engineer.weeklyGoalHours
        });
        if (error) {
            console.error('Error adding engineer:', error);
            alert('Failed to add engineer');
        }
    };

    const updateEngineer = async (engineer: Engineer) => {
        const { error } = await supabase.from('engineers').update({
            name: engineer.name,
            role: engineer.role,
            hourly_rate: engineer.hourlyRate,
            weekly_goal_hours: engineer.weeklyGoalHours
        }).eq('id', engineer.id);
        if (error) {
            console.error('Error updating engineer:', error);
            alert('Failed to update engineer');
        }
    };

    const deleteEngineer = async (id: string) => {
        const { error } = await supabase.from('engineers').delete().eq('id', id);
        if (error) {
            console.error('Error deleting engineer:', error);
            alert('Failed to delete engineer');
        }
    };

    // Entries
    const addEntry = async (entry: LogEntry) => {
        const { error } = await supabase.from('entries').insert({
            id: entry.id,
            project_id: entry.projectId,
            engineer_id: entry.engineerId,
            date: entry.date,
            task_description: entry.taskDescription,
            software_used: entry.softwareUsed,
            time_spent: entry.timeSpent,
            milestone: entry.milestone
        });
        if (error) {
            console.error('Error adding entry:', error);
            alert('Failed to add entry');
        }
    };

    const updateEntry = async (entry: LogEntry) => {
        const { error } = await supabase.from('entries').update({
            project_id: entry.projectId,
            engineer_id: entry.engineerId,
            date: entry.date,
            task_description: entry.taskDescription,
            software_used: entry.softwareUsed,
            time_spent: entry.timeSpent,
            milestone: entry.milestone
        }).eq('id', entry.id);

        if (error) {
            console.error('Error updating entry:', error);
            alert('Failed to update entry');
        }
    };

    const deleteEntry = async (id: string) => {
        const { error } = await supabase.from('entries').delete().eq('id', id);
        if (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry');
        }
    };

    // Attendance
    const addAttendance = async (record: AttendanceRecord) => {
        const { error } = await supabase.from('attendance').insert({
            id: record.id,
            engineer_id: record.engineerId,
            date: record.date,
            status: record.status
        });
        if (error) {
            console.error('Error adding attendance:', error);
            alert('Failed to add attendance (do you already have a record for this date?)');
        }
    };

    const updateAttendance = async (record: AttendanceRecord) => {
        const { error } = await supabase.from('attendance').update({
            status: record.status
        }).eq('id', record.id);
        if (error) {
            console.error('Error updating attendance:', error);
            alert('Failed to update attendance');
        }
    };

    const deleteAttendance = async (id: string) => {
        const { error } = await supabase.from('attendance').delete().eq('id', id);
        if (error) {
            console.error('Error deleting attendance:', error);
            alert('Failed to delete attendance');
        }
    };

    return (
        <DataContext.Provider value={{
            projects,
            engineers,
            entries,
            attendance,
            addProject,
            updateProject,
            deleteProject,
            addEngineer,
            updateEngineer,
            deleteEngineer,
            addEntry,
            updateEntry,
            deleteEntry,
            addAttendance,
            updateAttendance,
            deleteAttendance,
            isLoading
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
