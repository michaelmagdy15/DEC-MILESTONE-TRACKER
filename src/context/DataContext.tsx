import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Engineer, LogEntry, AttendanceRecord, Milestone, Task, LeaveRequest, Notification, Meeting, ProjectFile, TimeEntry, AppUsageLog } from '../types';
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
    meetings: Meeting[];
    projectFiles: ProjectFile[];
    timeEntries: TimeEntry[];
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

    addMeeting: (meeting: Meeting) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;

    addProjectFile: (file: ProjectFile) => Promise<void>;
    deleteProjectFile: (id: string) => Promise<void>;

    addTimeEntry: (entry: TimeEntry) => Promise<void>;
    updateTimeEntry: (entry: TimeEntry) => Promise<void>;

    addAppUsageLog: (log: AppUsageLog) => Promise<void>;

    clearMonthlyData: () => Promise<void>;

    appUsageLogs: AppUsageLog[];
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
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
    const [appUsageLogs, setAppUsageLogs] = useState<AppUsageLog[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const hasLoadedOnce = React.useRef(false);

    // SAFETY: Force data loading to stop after 10 seconds (only matters for the initial load)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) console.warn('DataContext: Safety timeout fired — forcing isLoading to false');
                return false;
            });
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const fetchData = async (isInitialLoad: boolean = false) => {
        try {
            // Only show loading on the very first fetch — never again
            if (isInitialLoad && !hasLoadedOnce.current) setIsLoading(true);

            // Each table fetch is independent — one failure won't block others
            const fetchTable = async (
                table: string,
                mapper: (row: any) => any,
                setter: (data: any) => void,
                orderBy: string = 'created_at',
                ascending: boolean = false
            ) => {
                try {
                    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending });
                    if (error) { console.error(`Error fetching ${table}:`, error); return; }
                    if (data) setter(data.map(mapper));
                } catch (err) {
                    console.error(`Exception fetching ${table}:`, err);
                }
            };

            // Fire ALL fetches in parallel — each is independent
            await Promise.allSettled([
                fetchTable('projects', (p: any) => ({
                    id: p.id, name: p.name, hourlyRate: p.hourly_rate,
                    budget: p.budget || 0, phase: p.phase || 'Planning',
                    leadDesignerId: p.lead_designer_id
                }), setProjects),

                fetchTable('engineers', (e: any) => ({
                    id: e.id, name: e.name, role: e.role,
                    hourlyRate: e.hourly_rate, weeklyGoalHours: e.weekly_goal_hours
                }), setEngineers),

                fetchTable('entries', (e: any) => ({
                    id: e.id, projectId: e.project_id, engineerId: e.engineer_id,
                    date: e.date, taskDescription: e.task_description,
                    softwareUsed: e.software_used || [], timeSpent: e.time_spent,
                    milestone: e.milestone, tags: e.tags || []
                }), setEntries, 'date'),

                fetchTable('attendance', (a: any) => ({
                    id: a.id, engineerId: a.engineer_id, date: a.date,
                    status: a.status, checkIn: a.check_in, checkOut: a.check_out
                }), setAttendance, 'date'),

                fetchTable('milestones', (m: any) => ({
                    id: m.id, projectId: m.project_id, name: m.name,
                    targetDate: m.target_date, completedPercentage: m.completed_percentage,
                    createdAt: m.created_at
                }), setMilestones),

                fetchTable('tasks', (t: any) => ({
                    id: t.id, projectId: t.project_id, milestoneId: t.milestone_id,
                    engineerId: t.engineer_id, title: t.title,
                    description: t.description, status: t.status, createdAt: t.created_at,
                    startDate: t.start_date, dueDate: t.due_date
                }), setTasks),

                fetchTable('leave_requests', (l: any) => ({
                    id: l.id, engineerId: l.engineer_id, startDate: l.start_date,
                    endDate: l.end_date, reason: l.reason, status: l.status
                }), setLeaveRequests),

                fetchTable('notifications', (n: any) => ({
                    id: n.id, engineerId: n.engineer_id, message: n.message,
                    isRead: n.is_read, createdAt: n.created_at
                }), setNotifications),

                fetchTable('meetings', (m: any) => ({
                    id: m.id, title: m.title, description: m.description,
                    date: m.date, time: m.time, type: m.type,
                    participants: m.participants, locationOrLink: m.location_or_link,
                    createdBy: m.created_by, createdAt: m.created_at
                }), setMeetings),

                fetchTable('project_files', (f: any) => ({
                    id: f.id, projectId: f.project_id, name: f.name,
                    fileFormat: f.file_format, fileUrl: f.file_url,
                    uploadedBy: f.uploaded_by, createdAt: f.created_at
                }), setProjectFiles),

                fetchTable('time_entries', (te: any) => ({
                    id: te.id, engineerId: te.engineer_id, entryType: te.entry_type,
                    startTime: te.start_time, endTime: te.end_time, createdAt: te.created_at
                }), setTimeEntries),

                fetchTable('app_usage_log', (l: any) => ({
                    id: l.id, engineerId: l.engineer_id, timestamp: l.timestamp,
                    activeWindow: l.active_window, durationSeconds: l.duration_seconds
                }), setAppUsageLogs),
            ]);

            hasLoadedOnce.current = true;

        } catch (error) {
            console.error('Fatal Error during fetchData:', error);

        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchData(true);

        const channels = supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'engineers' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_files' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => { fetchData() })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_usage_log' }, () => { fetchData() })
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
            hourly_rate: project.hourlyRate,
            budget: project.budget || 0,
            phase: project.phase || 'Planning',
            lead_designer_id: project.leadDesignerId
        });
        if (error) console.error('Error adding project:', error);
        else await fetchData();
    };

    const updateProject = async (project: Project) => {
        const { error } = await supabase.from('projects').update({
            name: project.name,
            hourly_rate: project.hourlyRate,
            budget: project.budget,
            phase: project.phase,
            lead_designer_id: project.leadDesignerId
        }).eq('id', project.id);

        if (error) console.error('Error updating project:', error);
        else await fetchData();
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) console.error('Error deleting project:', error);
        else await fetchData();
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
        if (error) console.error('Error adding engineer:', error);
        else await fetchData();
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
        } else {
            console.log('DataContext: updateEngineer successful');
            await fetchData();
        }
    };

    const deleteEngineer = async (id: string) => {
        const { error } = await supabase.from('engineers').delete().eq('id', id);
        if (error) console.error('Error deleting engineer:', error);
        else await fetchData();
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
        if (error) console.error('Error adding entry:', error);
        else await fetchData();
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

        if (error) console.error('Error updating entry:', error);
        else await fetchData();
    };

    const deleteEntry = async (id: string) => {
        const { error } = await supabase.from('entries').delete().eq('id', id);
        if (error) console.error('Error deleting entry:', error);
        else await fetchData();
    };

    // Attendance
    const addAttendance = async (record: AttendanceRecord) => {
        const { error } = await supabase.from('attendance').insert({
            id: record.id,
            engineer_id: record.engineerId,
            date: record.date,
            status: record.status
        });
        if (error) console.error('Error adding attendance:', error);
        else await fetchData();
    };

    const updateAttendance = async (record: AttendanceRecord) => {
        const { error } = await supabase.from('attendance').update({
            status: record.status
        }).eq('id', record.id);
        if (error) console.error('Error updating attendance:', error);
        else await fetchData();
    };

    const deleteAttendance = async (id: string) => {
        const { error } = await supabase.from('attendance').delete().eq('id', id);
        if (error) console.error('Error deleting attendance:', error);
        else await fetchData();
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
        else await fetchData();
    };

    const updateMilestone = async (milestone: Milestone) => {
        const { error } = await supabase.from('milestones').update({
            name: milestone.name,
            target_date: milestone.targetDate,
            completed_percentage: milestone.completedPercentage
        }).eq('id', milestone.id);
        if (error) console.error('Error updating milestone:', error);
        else await fetchData();
    };

    const deleteMilestone = async (id: string) => {
        const { error } = await supabase.from('milestones').delete().eq('id', id);
        if (error) console.error('Error deleting milestone:', error);
        else await fetchData();
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
            start_date: task.startDate,
            due_date: task.dueDate
        });
        if (error) console.error('Error adding task:', error);
        else await fetchData();
    };

    const updateTask = async (task: Task) => {
        const { error } = await supabase.from('tasks').update({
            milestone_id: task.milestoneId,
            engineer_id: task.engineerId,
            title: task.title,
            description: task.description,
            status: task.status,
            start_date: task.startDate,
            due_date: task.dueDate
        }).eq('id', task.id);
        if (error) console.error('Error updating task:', error);
        else await fetchData();
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) console.error('Error deleting task:', error);
        else await fetchData();
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
        else await fetchData();
    };

    const updateLeaveRequest = async (request: LeaveRequest) => {
        const { error } = await supabase.from('leave_requests').update({
            status: request.status
        }).eq('id', request.id);
        if (error) console.error('Error updating leave request:', error);
        else await fetchData();
    };

    const deleteLeaveRequest = async (id: string) => {
        const { error } = await supabase.from('leave_requests').delete().eq('id', id);
        if (error) console.error('Error deleting leave request:', error);
        else await fetchData();
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
        else await fetchData();
    };

    const markNotificationRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({
            is_read: true
        }).eq('id', id);
        if (error) console.error('Error updating notification:', error);
        else await fetchData();
    };

    // Meetings
    const addMeeting = async (meeting: Meeting) => {
        console.log('DataContext: addMeeting called', meeting);
        const { error } = await supabase.from('meetings').insert({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            date: meeting.date,
            time: meeting.time,
            type: meeting.type,
            location_or_link: meeting.locationOrLink
        });
        if (error) {
            console.error('Error adding meeting:', error);
            alert(`Failed to save meeting: ${error.message}`);
        } else {
            console.log('DataContext: addMeeting successful');
            await fetchData();
        }
    };

    const deleteMeeting = async (id: string) => {
        const { error } = await supabase.from('meetings').delete().eq('id', id);
        if (error) console.error('Error deleting meeting:', error);
        else await fetchData();
    };

    // Project Files
    const addProjectFile = async (file: ProjectFile) => {
        const { error } = await supabase.from('project_files').insert({
            id: file.id,
            project_id: file.projectId,
            name: file.name,
            file_format: file.fileFormat,
            file_url: file.fileUrl,
            uploaded_by: file.uploadedBy
        });
        if (error) console.error('Error adding project file:', error);
        else await fetchData();
    };

    const deleteProjectFile = async (id: string) => {
        const { error } = await supabase.from('project_files').delete().eq('id', id);
        if (error) console.error('Error deleting project file:', error);
        else await fetchData();
    };

    // Time Entries
    const addTimeEntry = async (entry: TimeEntry) => {
        // Optimistic: add to local state immediately so UI updates instantly
        setTimeEntries(prev => [...prev, entry]);
        const { error } = await supabase.from('time_entries').insert({
            id: entry.id,
            engineer_id: entry.engineerId,
            entry_type: entry.entryType,
            start_time: entry.startTime,
            end_time: entry.endTime
        });
        if (error) console.error('Error adding time entry:', error);
        else await fetchData();
    };

    const updateTimeEntry = async (entry: TimeEntry) => {
        // Optimistic: update local state immediately so the timer stops counting
        setTimeEntries(prev => prev.map(te => te.id === entry.id ? { ...te, endTime: entry.endTime } : te));
        const { error } = await supabase.from('time_entries').update({
            end_time: entry.endTime
        }).eq('id', entry.id);
        if (error) console.error('Error updating time entry:', error);
        else await fetchData();
    };

    // App Usage Logs
    const addAppUsageLog = async (log: AppUsageLog) => {
        const { error } = await supabase.from('app_usage_log').insert({
            id: log.id,
            engineer_id: log.engineerId,
            timestamp: log.timestamp,
            active_window: log.activeWindow,
            duration_seconds: log.durationSeconds
        });
        if (error) console.error('Error adding app usage log:', error);
        else await fetchData();
    };

    // Clear transient monthly data — keeps projects, engineers, and project files
    const clearMonthlyData = async () => {
        try {
            setIsLoading(true);
            const tables = ['entries', 'attendance', 'tasks', 'milestones', 'time_entries', 'notifications', 'leave_requests', 'meetings'];
            for (const table of tables) {
                const { error } = await supabase.from(table).delete().not('id', 'is', null);
                if (error) console.error(`Error clearing ${table}:`, error);
            }
            // Reset local state
            setEntries([]);
            setAttendance([]);
            setTasks([]);
            setMilestones([]);
            setTimeEntries([]);
            setNotifications([]);
            setLeaveRequests([]);
            setMeetings([]);
        } catch (err) {
            console.error('Error clearing monthly data:', err);
        } finally {
            setIsLoading(false);
        }
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
            meetings,
            projectFiles,
            timeEntries,
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
            addMeeting,
            deleteMeeting,
            addProjectFile,
            deleteProjectFile,
            addTimeEntry,
            updateTimeEntry,
            addAppUsageLog,
            clearMonthlyData,
            appUsageLogs,
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
