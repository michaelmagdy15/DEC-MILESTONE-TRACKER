import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Project, Engineer, LogEntry, AttendanceRecord, Milestone, Task, LeaveRequest, Notification, Meeting, ProjectFile, TimeEntry, AppUsageLog, AuditLog, OfficeExpense } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
    updateMeeting: (meeting: Meeting) => Promise<void>;
    deleteMeeting: (id: string) => Promise<void>;

    addProjectFile: (file: ProjectFile) => Promise<void>;
    deleteProjectFile: (id: string) => Promise<void>;

    addTimeEntry: (entry: TimeEntry) => Promise<void>;
    updateTimeEntry: (entry: TimeEntry) => Promise<void>;

    addAppUsageLog: (log: AppUsageLog) => Promise<void>;

    clearMonthlyData: () => Promise<void>;

    appUsageLogs: AppUsageLog[];
    auditLogs: AuditLog[];
    officeExpenses: OfficeExpense[];
    isLoading: boolean;

    addOfficeExpense: (expense: OfficeExpense) => Promise<void>;
    deleteOfficeExpense: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Table fetch configuration ───────────────────────────────────
// Centralizes mappers so both initial fetch and realtime refresh use the same logic.
type TableName = 'projects' | 'engineers' | 'entries' | 'attendance' | 'milestones' | 'tasks' | 'leave_requests' | 'notifications' | 'meetings' | 'project_files' | 'time_entries' | 'app_usage_log' | 'audit_log' | 'office_expenses';

interface TableConfig {
    mapper: (row: any) => any;
    orderBy: string;
    ascending: boolean;
}

const TABLE_CONFIGS: Record<TableName, TableConfig> = {
    projects: {
        mapper: (p: any) => ({ id: p.id, name: p.name, hourlyRate: p.hourly_rate, budget: p.budget || 0, phase: p.phase || 'Planning', leadDesignerId: p.lead_designer_id, teamMembers: p.team_members || [], startDate: p.start_date, endDate: p.end_date }),
        orderBy: 'created_at', ascending: false,
    },
    engineers: {
        mapper: (e: any) => ({ id: e.id, name: e.name, role: e.role, hourlyRate: e.hourly_rate, weeklyGoalHours: e.weekly_goal_hours, location: e.location }),
        orderBy: 'created_at', ascending: false,
    },
    entries: {
        mapper: (e: any) => ({ id: e.id, projectId: e.project_id, engineerId: e.engineer_id, date: e.date, taskDescription: e.task_description, softwareUsed: e.software_used || [], timeSpent: e.time_spent, milestone: e.milestone, tags: e.tags || [], entryType: e.entry_type || 'normal' }),
        orderBy: 'date', ascending: false,
    },
    attendance: {
        mapper: (a: any) => ({ id: a.id, engineerId: a.engineer_id, date: a.date, status: a.status, checkIn: a.check_in, checkOut: a.check_out }),
        orderBy: 'date', ascending: false,
    },
    milestones: {
        mapper: (m: any) => ({ id: m.id, projectId: m.project_id, name: m.name, targetDate: m.target_date, completedPercentage: m.completed_percentage, createdAt: m.created_at }),
        orderBy: 'created_at', ascending: false,
    },
    tasks: {
        mapper: (t: any) => ({ id: t.id, projectId: t.project_id, milestoneId: t.milestone_id, engineerId: t.engineer_id, title: t.title, description: t.description, status: t.status, createdAt: t.created_at, startDate: t.start_date, dueDate: t.due_date }),
        orderBy: 'created_at', ascending: false,
    },
    leave_requests: {
        mapper: (l: any) => ({ id: l.id, engineerId: l.engineer_id, startDate: l.start_date, endDate: l.end_date, reason: l.reason, status: l.status }),
        orderBy: 'created_at', ascending: false,
    },
    notifications: {
        mapper: (n: any) => ({ id: n.id, engineerId: n.engineer_id, message: n.message, isRead: n.is_read, createdAt: n.created_at }),
        orderBy: 'created_at', ascending: false,
    },
    meetings: {
        mapper: (m: any) => ({ id: m.id, title: m.title, description: m.description, date: m.date, time: m.time, type: m.type, participants: m.participants, locationOrLink: m.location_or_link, createdBy: m.created_by, createdAt: m.created_at }),
        orderBy: 'created_at', ascending: false,
    },
    project_files: {
        mapper: (f: any) => ({ id: f.id, projectId: f.project_id, name: f.name, fileFormat: f.file_format, fileUrl: f.file_url, uploadedBy: f.uploaded_by, createdAt: f.created_at }),
        orderBy: 'created_at', ascending: false,
    },
    time_entries: {
        mapper: (te: any) => ({ id: te.id, engineerId: te.engineer_id, entryType: te.entry_type, startTime: te.start_time, endTime: te.end_time, createdAt: te.created_at }),
        orderBy: 'created_at', ascending: false,
    },
    app_usage_log: {
        mapper: (l: any) => ({ id: l.id, engineerId: l.engineer_id, timestamp: l.timestamp, activeWindow: l.active_window, durationSeconds: l.duration_seconds }),
        orderBy: 'timestamp', ascending: false,
    },
    audit_log: {
        mapper: (a: any) => ({ id: a.id, userId: a.user_id, action: a.action, tableName: a.table_name, recordId: a.record_id, changes: a.changes || {}, createdAt: a.created_at }),
        orderBy: 'created_at', ascending: false,
    },
    office_expenses: {
        mapper: (o: any) => ({ id: o.id, location: o.location, category: o.category, amount: o.amount, currency: o.currency, description: o.description, date: o.date, createdAt: o.created_at }),
        orderBy: 'date', ascending: false,
    },
};

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
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [officeExpenses, setOfficeExpenses] = useState<OfficeExpense[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const hasLoadedOnce = useRef(false);

    // Setter map — allows fetching a single table by name
    const setterMap: Record<TableName, (data: any) => void> = {
        projects: setProjects,
        engineers: setEngineers,
        entries: setEntries,
        attendance: setAttendance,
        milestones: setMilestones,
        tasks: setTasks,
        leave_requests: setLeaveRequests,
        notifications: setNotifications,
        meetings: setMeetings,
        project_files: setProjectFiles,
        time_entries: setTimeEntries,
        app_usage_log: setAppUsageLogs,
        audit_log: setAuditLogs,
        office_expenses: setOfficeExpenses,
    };

    // ─── Audit helper: silently log CRUD actions ─────────────────
    const logAudit = async (action: 'created' | 'updated' | 'deleted', tableName: string, recordId: string, changes: Record<string, any> = {}) => {
        if (!user) return;
        try {
            await supabase.from('audit_log').insert({
                user_id: user.id,
                action,
                table_name: tableName,
                record_id: recordId,
                changes,
            });
        } catch { /* audit logging is best-effort, don't block the UI */ }
    };

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

    // ─── Single-table fetch ──────────────────────────────────────
    const fetchSingleTable = useCallback(async (tableName: TableName) => {
        const config = TABLE_CONFIGS[tableName];
        const setter = setterMap[tableName];
        try {
            const { data, error } = await supabase.from(tableName).select('*').order(config.orderBy, { ascending: config.ascending });
            if (error) { console.error(`Error fetching ${tableName}:`, error); return; }
            if (data) setter(data.map(config.mapper));
        } catch (err) {
            console.error(`Exception fetching ${tableName}:`, err);
        }
    }, []);

    // ─── Full initial fetch (all tables in parallel) ─────────────
    const fetchAllTables = useCallback(async (isInitialLoad: boolean = false) => {
        try {
            if (isInitialLoad && !hasLoadedOnce.current) setIsLoading(true);

            await Promise.allSettled(
                (Object.keys(TABLE_CONFIGS) as TableName[]).map(t => fetchSingleTable(t))
            );

            hasLoadedOnce.current = true;
        } catch (error) {
            console.error('Fatal Error during fetchData:', error);
        } finally {
            setIsLoading(false);
        }
    }, [fetchSingleTable]);

    // ─── Debounced per-table refetch for realtime ────────────────
    const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const debouncedRefetch = useCallback((tableName: TableName) => {
        if (debounceTimers.current[tableName]) {
            clearTimeout(debounceTimers.current[tableName]);
        }
        debounceTimers.current[tableName] = setTimeout(() => {
            fetchSingleTable(tableName);
        }, 300);
    }, [fetchSingleTable]);

    useEffect(() => {
        if (!user) return;

        fetchAllTables(true);

        // Subscribe to realtime changes — only refetch the affected table
        const WATCHED_TABLES: TableName[] = ['projects', 'engineers', 'entries', 'attendance', 'milestones', 'tasks', 'leave_requests', 'notifications', 'meetings', 'project_files', 'time_entries', 'office_expenses'];

        const channels = supabase.channel('custom-all-channel');
        for (const table of WATCHED_TABLES) {
            channels.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
                debouncedRefetch(table);
            });
        }
        channels.subscribe();

        return () => {
            supabase.removeChannel(channels);
            // Clear all pending debounce timers
            Object.values(debounceTimers.current).forEach(clearTimeout);
        };
    }, [user?.id, fetchAllTables, debouncedRefetch]);

    // ─── CRUD helpers with toast feedback ─────────────────────────
    // Projects
    const addProject = async (project: Project) => {
        const { error } = await supabase.from('projects').insert({
            id: project.id, name: project.name, hourly_rate: project.hourlyRate,
            budget: project.budget || 0, phase: project.phase || 'Planning', lead_designer_id: project.leadDesignerId,
            team_members: project.teamMembers || [], start_date: project.startDate, end_date: project.endDate
        });
        if (error) { toast.error(`Failed to add project: ${error.message}`); return; }
        toast.success('Project created');
        void logAudit('created', 'projects', project.id, { name: project.name });
        await fetchSingleTable('projects');
    };

    const updateProject = async (project: Project) => {
        const { error } = await supabase.from('projects').update({
            name: project.name, hourly_rate: project.hourlyRate, budget: project.budget,
            phase: project.phase, lead_designer_id: project.leadDesignerId,
            team_members: project.teamMembers || [], start_date: project.startDate, end_date: project.endDate
        }).eq('id', project.id);
        if (error) { toast.error(`Failed to update project: ${error.message}`); return; }
        toast.success('Project updated');
        void logAudit('updated', 'projects', project.id, { name: project.name });
        await fetchSingleTable('projects');
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete project: ${error.message}`); return; }
        toast.success('Project deleted');
        void logAudit('deleted', 'projects', id);
        await fetchSingleTable('projects');
    };

    // Engineers
    const addEngineer = async (engineer: Engineer) => {
        const { error } = await supabase.from('engineers').insert({
            id: engineer.id, name: engineer.name, role: engineer.role,
            hourly_rate: engineer.hourlyRate, weekly_goal_hours: engineer.weeklyGoalHours
        });
        if (error) { toast.error(`Failed to add engineer: ${error.message}`); return; }
        toast.success('Engineer added');
        void logAudit('created', 'engineers', engineer.id, { name: engineer.name });
        await fetchSingleTable('engineers');
    };

    const updateEngineer = async (engineer: Engineer) => {
        const { error } = await supabase.from('engineers').upsert({
            id: engineer.id, name: engineer.name, role: engineer.role,
            hourly_rate: engineer.hourlyRate, weekly_goal_hours: engineer.weeklyGoalHours
        });
        if (error) { toast.error(`Failed to update engineer: ${error.message}`); return; }
        toast.success('Engineer updated');
        void logAudit('updated', 'engineers', engineer.id, { name: engineer.name });
        await fetchSingleTable('engineers');
    };


    const deleteEngineer = async (id: string) => {
        const { error } = await supabase.from('engineers').delete().eq('id', id);
        if (error) {
            console.error('Delete Engineer Error:', error);
            if (error.code === '23503') {
                toast.error('Cannot remove specialist: They have active project entries or assigned tasks. Reassign or clear their data first.');
            } else {
                toast.error(`Failed to delete engineer: ${error.message}`);
            }
            return;
        }
        toast.success('Engineer record purged from roster');
        void logAudit('deleted', 'engineers', id);
        await fetchSingleTable('engineers');
    };

    // Entries
    const addEntry = async (entry: LogEntry) => {
        const { error } = await supabase.from('entries').insert({
            id: entry.id, project_id: entry.projectId, engineer_id: entry.engineerId,
            date: entry.date, task_description: entry.taskDescription,
            software_used: entry.softwareUsed, time_spent: entry.timeSpent,
            milestone: entry.milestone, tags: entry.tags, entry_type: entry.entryType
        });
        if (error) { toast.error(`Failed to add entry: ${error.message}`); return; }
        toast.success('Entry logged');
        void logAudit('created', 'entries', entry.id, { description: entry.taskDescription, hours: entry.timeSpent });
        await fetchSingleTable('entries');
    };

    const updateEntry = async (entry: LogEntry) => {
        const { error } = await supabase.from('entries').update({
            project_id: entry.projectId, engineer_id: entry.engineerId,
            date: entry.date, task_description: entry.taskDescription,
            software_used: entry.softwareUsed, time_spent: entry.timeSpent,
            milestone: entry.milestone, tags: entry.tags, entry_type: entry.entryType
        }).eq('id', entry.id);
        if (error) { toast.error(`Failed to update entry: ${error.message}`); return; }
        toast.success('Entry updated');
        await fetchSingleTable('entries');
    };

    const deleteEntry = async (id: string) => {
        const { error } = await supabase.from('entries').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete entry: ${error.message}`); return; }
        toast.success('Entry deleted');
        await fetchSingleTable('entries');
    };

    // Attendance
    const addAttendance = async (record: AttendanceRecord) => {
        const { error } = await supabase.from('attendance').insert({
            id: record.id, engineer_id: record.engineerId, date: record.date, status: record.status
        });
        if (error) { toast.error(`Failed to record attendance: ${error.message}`); return; }
        toast.success('Attendance recorded');
        await fetchSingleTable('attendance');
    };

    const updateAttendance = async (record: AttendanceRecord) => {
        const { error } = await supabase.from('attendance').update({ status: record.status }).eq('id', record.id);
        if (error) { toast.error(`Failed to update attendance: ${error.message}`); return; }
        toast.success('Attendance updated');
        await fetchSingleTable('attendance');
    };

    const deleteAttendance = async (id: string) => {
        const { error } = await supabase.from('attendance').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete attendance: ${error.message}`); return; }
        await fetchSingleTable('attendance');
    };

    // Milestones
    const addMilestone = async (milestone: Milestone) => {
        const { error } = await supabase.from('milestones').insert({
            id: milestone.id, project_id: milestone.projectId, name: milestone.name,
            target_date: milestone.targetDate, completed_percentage: milestone.completedPercentage
        });
        if (error) { toast.error(`Failed to add milestone: ${error.message}`); return; }
        toast.success('Milestone created');
        await fetchSingleTable('milestones');
    };

    const updateMilestone = async (milestone: Milestone) => {
        const { error } = await supabase.from('milestones').update({
            name: milestone.name, target_date: milestone.targetDate,
            completed_percentage: milestone.completedPercentage
        }).eq('id', milestone.id);
        if (error) { toast.error(`Failed to update milestone: ${error.message}`); return; }
        toast.success('Milestone updated');
        await fetchSingleTable('milestones');
    };

    const deleteMilestone = async (id: string) => {
        const { error } = await supabase.from('milestones').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete milestone: ${error.message}`); return; }
        toast.success('Milestone deleted');
        await fetchSingleTable('milestones');
    };

    // Tasks
    const addTask = async (task: Task) => {
        const { error } = await supabase.from('tasks').insert({
            id: task.id, project_id: task.projectId, milestone_id: task.milestoneId,
            engineer_id: task.engineerId, title: task.title, description: task.description,
            status: task.status, start_date: task.startDate, due_date: task.dueDate
        });
        if (error) { toast.error(`Failed to add task: ${error.message}`); return; }
        toast.success('Task created');
        await fetchSingleTable('tasks');
    };

    const updateTask = async (task: Task) => {
        const { error } = await supabase.from('tasks').update({
            milestone_id: task.milestoneId, engineer_id: task.engineerId, title: task.title,
            description: task.description, status: task.status,
            start_date: task.startDate, due_date: task.dueDate
        }).eq('id', task.id);
        if (error) { toast.error(`Failed to update task: ${error.message}`); return; }
        toast.success('Task updated');
        await fetchSingleTable('tasks');
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete task: ${error.message}`); return; }
        toast.success('Task deleted');
        await fetchSingleTable('tasks');
    };

    // Leave Requests
    const addLeaveRequest = async (request: LeaveRequest) => {
        const { error } = await supabase.from('leave_requests').insert({
            id: request.id, engineer_id: request.engineerId, start_date: request.startDate,
            end_date: request.endDate, reason: request.reason, status: request.status
        });
        if (error) { toast.error(`Failed to submit leave request: ${error.message}`); return; }
        toast.success('Leave request submitted');
        await fetchSingleTable('leave_requests');
    };

    const updateLeaveRequest = async (request: LeaveRequest) => {
        const { error } = await supabase.from('leave_requests').update({ status: request.status }).eq('id', request.id);
        if (error) { toast.error(`Failed to update leave request: ${error.message}`); return; }
        toast.success(`Leave request ${request.status}`);
        await fetchSingleTable('leave_requests');
    };

    const deleteLeaveRequest = async (id: string) => {
        const { error } = await supabase.from('leave_requests').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete leave request: ${error.message}`); return; }
        await fetchSingleTable('leave_requests');
    };

    // Notifications
    const addNotification = async (notification: Notification) => {
        const { error } = await supabase.from('notifications').insert({
            id: notification.id, engineer_id: notification.engineerId,
            message: notification.message, is_read: notification.isRead
        });
        if (error) console.error('Error adding notification:', error);
        else await fetchSingleTable('notifications');
    };

    const markNotificationRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        if (error) console.error('Error updating notification:', error);
        else await fetchSingleTable('notifications');
    };

    // Meetings
    const addMeeting = async (meeting: Meeting) => {
        const { error } = await supabase.from('meetings').insert({
            id: meeting.id, title: meeting.title, description: meeting.description,
            date: meeting.date, time: meeting.time, type: meeting.type,
            location_or_link: meeting.locationOrLink
        });
        if (error) { toast.error(`Failed to save meeting: ${error.message}`); return; }
        toast.success('Meeting scheduled');
        await fetchSingleTable('meetings');
    };

    const updateMeeting = async (meeting: Meeting) => {
        const { error } = await supabase.from('meetings').update({
            title: meeting.title, description: meeting.description,
            date: meeting.date, time: meeting.time, type: meeting.type,
            location_or_link: meeting.locationOrLink
        }).eq('id', meeting.id);
        if (error) { toast.error(`Failed to update meeting: ${error.message}`); return; }
        toast.success('Meeting updated');
        await fetchSingleTable('meetings');
    };

    const deleteMeeting = async (id: string) => {
        const { error } = await supabase.from('meetings').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete meeting: ${error.message}`); return; }
        toast.success('Meeting deleted');
        await fetchSingleTable('meetings');
    };

    // Project Files
    const addProjectFile = async (file: ProjectFile) => {
        const { error } = await supabase.from('project_files').insert({
            id: file.id, project_id: file.projectId, name: file.name,
            file_format: file.fileFormat, file_url: file.fileUrl, uploaded_by: file.uploadedBy
        });
        if (error) { toast.error(`Failed to upload file: ${error.message}`); return; }
        toast.success('File uploaded');
        await fetchSingleTable('project_files');
    };

    const deleteProjectFile = async (id: string) => {
        const { error } = await supabase.from('project_files').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete file: ${error.message}`); return; }
        toast.success('File deleted');
        await fetchSingleTable('project_files');
    };

    // Time Entries
    const addTimeEntry = async (entry: TimeEntry) => {
        // Optimistic: add to local state immediately so UI updates instantly
        setTimeEntries(prev => [...prev, entry]);
        const { error } = await supabase.from('time_entries').insert({
            id: entry.id, engineer_id: entry.engineerId, entry_type: entry.entryType,
            start_time: entry.startTime, end_time: entry.endTime
        });
        if (error) { toast.error(`Failed to record time: ${error.message}`); return; }
        await fetchSingleTable('time_entries');
    };

    const updateTimeEntry = async (entry: TimeEntry) => {
        // Optimistic: update local state immediately so the timer stops counting
        setTimeEntries(prev => prev.map(te => te.id === entry.id ? { ...te, endTime: entry.endTime } : te));
        const { error } = await supabase.from('time_entries').update({ end_time: entry.endTime }).eq('id', entry.id);
        if (error) { toast.error(`Failed to update time entry: ${error.message}`); return; }
        await fetchSingleTable('time_entries');
    };

    // App Usage Logs
    const addAppUsageLog = async (log: AppUsageLog) => {
        const { error } = await supabase.from('app_usage_log').insert({
            id: log.id, engineer_id: log.engineerId, timestamp: log.timestamp,
            active_window: log.activeWindow, duration_seconds: log.durationSeconds
        });
        if (error) console.error('Error adding app usage log:', error);
        else await fetchSingleTable('app_usage_log');
    };

    // Office Expenses
    const addOfficeExpense = async (expense: OfficeExpense) => {
        const { error } = await supabase.from('office_expenses').insert({
            id: expense.id, location: expense.location, category: expense.category,
            amount: expense.amount, currency: expense.currency, description: expense.description,
            date: expense.date
        });
        if (error) { toast.error(`Failed to add expense: ${error.message}`); return; }
        toast.success(`Expense logged in ${expense.currency}`);
        void logAudit('created', 'office_expenses', expense.id, { category: expense.category, amount: expense.amount });
        await fetchSingleTable('office_expenses');
    };

    const deleteOfficeExpense = async (id: string) => {
        const { error } = await supabase.from('office_expenses').delete().eq('id', id);
        if (error) { toast.error(`Failed to delete expense: ${error.message}`); return; }
        toast.success('Expense deleted');
        void logAudit('deleted', 'office_expenses', id);
        await fetchSingleTable('office_expenses');
    };

    // Clear transient monthly data — keeps projects, engineers, and project files
    const clearMonthlyData = async () => {
        try {
            setIsLoading(true);
            const tables: TableName[] = ['entries', 'attendance', 'tasks', 'milestones', 'time_entries', 'notifications', 'leave_requests', 'meetings'];
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
            toast.success('System data cleared');
        } catch (err) {
            console.error('Error clearing monthly data:', err);
            toast.error('Failed to clear system data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DataContext.Provider value={{
            projects, engineers, entries, attendance, milestones, tasks,
            leaveRequests, notifications, meetings, projectFiles, timeEntries,
            addProject, updateProject, deleteProject,
            addEngineer, updateEngineer, deleteEngineer,
            addEntry, updateEntry, deleteEntry,
            addAttendance, updateAttendance, deleteAttendance,
            addMilestone, updateMilestone, deleteMilestone,
            addTask, updateTask, deleteTask,
            addLeaveRequest, updateLeaveRequest, deleteLeaveRequest,
            addNotification, markNotificationRead,
            addMeeting, updateMeeting, deleteMeeting,
            addProjectFile, deleteProjectFile,
            addTimeEntry, updateTimeEntry,
            addAppUsageLog,
            addOfficeExpense, deleteOfficeExpense,
            clearMonthlyData,
            appUsageLogs, auditLogs, officeExpenses, isLoading
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
