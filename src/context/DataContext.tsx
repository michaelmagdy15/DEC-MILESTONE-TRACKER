import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Engineer, LogEntry, AttendanceRecord, Milestone, Task, LeaveRequest, Notification } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
    projects: Project[];
    engineers: Engineer[];
    entries: LogEntry[];
    attendance: AttendanceRecord[];
    milestones: Milestone[];
    tasks: Task[];
    leaveRequests: LeaveRequest[];
    notifications: Notification[];
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

    // New Feature Methods
    addMilestone: (milestone: Milestone) => Promise<void>;
    updateMilestone: (milestone: Milestone) => Promise<void>;
    deleteMilestone: (id: string) => Promise<void>;

    addTask: (task: Task) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    addLeaveRequest: (request: LeaveRequest) => Promise<void>;
    updateLeaveRequest: (request: LeaveRequest) => Promise<void>;
    deleteLeaveRequest: (id: string) => Promise<void>;

    addNotification: (notification: Notification) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;

    isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [engineers, setEngineers] = useState<Engineer[]>([]);
    const [entries, setEntries] = useState<LogEntry[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [
                projectsRes, engineersRes, entriesRes, attendanceRes,
                milestonesRes, tasksRes, leaveRequestsRes, notificationsRes
            ] = await Promise.all([
                supabase.from('projects').select('*').order('created_at', { ascending: false }),
                supabase.from('engineers').select('*').order('created_at', { ascending: false }),
                supabase.from('entries').select('*').order('date', { ascending: false }),
                supabase.from('attendance').select('*').order('date', { ascending: false }),
                supabase.from('milestones').select('*').order('created_at', { ascending: false }),
                supabase.from('tasks').select('*').order('created_at', { ascending: false }),
                supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
                supabase.from('notifications').select('*').order('created_at', { ascending: false })
            ]);

            if (projectsRes.error) throw projectsRes.error;
            if (engineersRes.error) throw engineersRes.error;
            if (entriesRes.error) throw entriesRes.error;
            if (attendanceRes.error) throw attendanceRes.error;
            if (milestonesRes.error) throw milestonesRes.error;
            if (tasksRes.error) throw tasksRes.error;
            if (leaveRequestsRes.error) throw leaveRequestsRes.error;
            if (notificationsRes.error) throw notificationsRes.error;

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
                milestone: e.milestone,
                tags: e.tags || []
            })));

            setAttendance(attendanceRes.data.map((a: any) => ({
                id: a.id,
                engineerId: a.engineer_id,
                date: a.date,
                status: a.status
            })));

            setMilestones(milestonesRes.data.map((m: any) => ({
                id: m.id,
                projectId: m.project_id,
                name: m.name,
                targetDate: m.target_date,
                completedPercentage: m.completed_percentage || 0,
                createdAt: m.created_at
            })));

            setTasks(tasksRes.data.map((t: any) => ({
                id: t.id,
                projectId: t.project_id,
                milestoneId: t.milestone_id,
                engineerId: t.engineer_id,
                title: t.title,
                description: t.description,
                status: t.status,
                dueDate: t.due_date,
                createdAt: t.created_at
            })));

            setLeaveRequests(leaveRequestsRes.data.map((l: any) => ({
                id: l.id,
                engineerId: l.engineer_id,
                startDate: l.start_date,
                endDate: l.end_date,
                reason: l.reason,
                status: l.status,
                createdAt: l.created_at
            })));

            setNotifications(notificationsRes.data.map((n: any) => ({
                id: n.id,
                engineerId: n.engineer_id,
                message: n.message,
                isRead: n.is_read,
                createdAt: n.created_at
            })));

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data from database');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

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
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'milestones' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leave_requests' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => { fetchData() }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, [user?.id]);

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
        console.log('DataContext: updateEngineer called', engineer);
        // Using upsert to handle cases where the engineer record might be missing
        const { error } = await supabase.from('engineers').upsert({
            id: engineer.id,
            name: engineer.name,
            role: engineer.role,
            hourly_rate: engineer.hourlyRate,
            weekly_goal_hours: engineer.weeklyGoalHours
        });

        if (error) {
            console.error('DataContext: Error updating engineer:', error);
            alert('Failed to update engineer: ' + error.message);
        } else {
            console.log('DataContext: updateEngineer successful');
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
            milestone: entry.milestone,
            tags: entry.tags
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
            milestone: entry.milestone,
            tags: entry.tags
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

    // Milestones
    const addMilestone = async (milestone: Milestone) => {
        const { error } = await supabase.from('milestones').insert({
            id: milestone.id,
            project_id: milestone.projectId,
            name: milestone.name,
            target_date: milestone.targetDate,
            completed_percentage: milestone.completedPercentage
        });
        if (error) console.error('Error adding milestone:', error);
    };

    const updateMilestone = async (milestone: Milestone) => {
        const { error } = await supabase.from('milestones').update({
            name: milestone.name,
            target_date: milestone.targetDate,
            completed_percentage: milestone.completedPercentage
        }).eq('id', milestone.id);
        if (error) console.error('Error updating milestone:', error);
    };

    const deleteMilestone = async (id: string) => {
        const { error } = await supabase.from('milestones').delete().eq('id', id);
        if (error) console.error('Error deleting milestone:', error);
    };

    // Tasks
    const addTask = async (task: Task) => {
        const { error } = await supabase.from('tasks').insert({
            id: task.id,
            project_id: task.projectId,
            milestone_id: task.milestoneId,
            engineer_id: task.engineerId,
            title: task.title,
            description: task.description,
            status: task.status,
            due_date: task.dueDate
        });
        if (error) console.error('Error adding task:', error);
    };

    const updateTask = async (task: Task) => {
        const { error } = await supabase.from('tasks').update({
            milestone_id: task.milestoneId,
            engineer_id: task.engineerId,
            title: task.title,
            description: task.description,
            status: task.status,
            due_date: task.dueDate
        }).eq('id', task.id);
        if (error) console.error('Error updating task:', error);
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) console.error('Error deleting task:', error);
    };

    // Leave Requests
    const addLeaveRequest = async (request: LeaveRequest) => {
        const { error } = await supabase.from('leave_requests').insert({
            id: request.id,
            engineer_id: request.engineerId,
            start_date: request.startDate,
            end_date: request.endDate,
            reason: request.reason,
            status: request.status
        });
        if (error) console.error('Error adding leave request:', error);
    };

    const updateLeaveRequest = async (request: LeaveRequest) => {
        const { error } = await supabase.from('leave_requests').update({
            status: request.status
        }).eq('id', request.id);
        if (error) console.error('Error updating leave request:', error);
    };

    const deleteLeaveRequest = async (id: string) => {
        const { error } = await supabase.from('leave_requests').delete().eq('id', id);
        if (error) console.error('Error deleting leave request:', error);
    };

    // Notifications
    const addNotification = async (notification: Notification) => {
        const { error } = await supabase.from('notifications').insert({
            id: notification.id,
            engineer_id: notification.engineerId,
            message: notification.message,
            is_read: notification.isRead
        });
        if (error) console.error('Error adding notification:', error);
    };

    const markNotificationRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({
            is_read: true
        }).eq('id', id);
        if (error) console.error('Error updating notification:', error);
    };

    return (
        <DataContext.Provider value={{
            projects,
            engineers,
            entries,
            attendance,
            milestones,
            tasks,
            leaveRequests,
            notifications,
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
            addMilestone,
            updateMilestone,
            deleteMilestone,
            addTask,
            updateTask,
            deleteTask,
            addLeaveRequest,
            updateLeaveRequest,
            deleteLeaveRequest,
            addNotification,
            markNotificationRead,
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
