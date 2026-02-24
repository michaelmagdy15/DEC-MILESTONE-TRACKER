import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Engineer, LogEntry, AttendanceRecord, Milestone, Task, LeaveRequest, Notification, Meeting, ProjectFile, TimeEntry } from '../types';
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

    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const fetchData = async (showLoading: boolean = false) => {
        try {
            if (showLoading) setIsLoading(true);

            // Fetch projects
            const projectsRes = await supabase.from('projects').select('*').order('created_at', { ascending: false });
            if (projectsRes.error) console.error('Error fetching projects:', projectsRes.error);
            else {
                setProjects(projectsRes.data.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    hourlyRate: p.hourly_rate,
                    budget: p.budget || 0,
                    phase: p.phase || 'Planning'
                })));
            }

            // Fetch engineers
            const engineersRes = await supabase.from('engineers').select('*').order('created_at', { ascending: false });
            if (engineersRes.error) console.error('Error fetching engineers:', engineersRes.error);
            else {

                setEngineers(engineersRes.data.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    role: e.role,
                    hourlyRate: e.hourly_rate,
                    weeklyGoalHours: e.weekly_goal_hours
                })));
            }

            // Fetch entries
            const entriesRes = await supabase.from('entries').select('*').order('date', { ascending: false });
            if (entriesRes.error) console.error('Error fetching entries:', entriesRes.error);
            else {
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
            }

            // Fetch attendance
            const attendanceRes = await supabase.from('attendance').select('*').order('date', { ascending: false });
            if (attendanceRes.error) console.error('Error fetching attendance:', attendanceRes.error);
            else {
                setAttendance(attendanceRes.data.map((a: any) => ({
                    id: a.id,
                    engineerId: a.engineer_id,
                    date: a.date,
                    status: a.status
                })));
            }

            // Fetch milestones
            const milestonesRes = await supabase.from('milestones').select('*').order('created_at', { ascending: false });
            if (milestonesRes.error) console.error('Error fetching milestones:', milestonesRes.error);
            else {
                setMilestones(milestonesRes.data.map((m: any) => ({
                    id: m.id,
                    projectId: m.project_id,
                    name: m.name,
                    targetDate: m.target_date,
                    completedPercentage: m.completed_percentage || 0,
                    createdAt: m.created_at
                })));
            }

            // Fetch tasks
            const tasksRes = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
            if (tasksRes.error) console.error('Error fetching tasks:', tasksRes.error);
            else {
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
            }

            // Fetch leave requests
            const leaveRequestsRes = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
            if (leaveRequestsRes.error) console.error('Error fetching leave_requests:', leaveRequestsRes.error);
            else {
                setLeaveRequests(leaveRequestsRes.data.map((l: any) => ({
                    id: l.id,
                    engineerId: l.engineer_id,
                    startDate: l.start_date,
                    endDate: l.end_date,
                    reason: l.reason,
                    status: l.status,
                    createdAt: l.created_at
                })));
            }

            // Fetch notifications
            const notificationsRes = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
            if (notificationsRes.error) console.error('Error fetching notifications:', notificationsRes.error);
            else {
                setNotifications(notificationsRes.data.map((n: any) => ({
                    id: n.id,
                    engineerId: n.engineer_id,
                    message: n.message,
                    isRead: n.is_read,
                    createdAt: n.created_at
                })));
            }

            // Fetch meetings
            const meetingsRes = await supabase.from('meetings').select('*').order('date', { ascending: true });
            if (meetingsRes.error) console.error('Error fetching meetings:', meetingsRes.error);
            else {
                setMeetings(meetingsRes.data.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    date: m.date,
                    time: m.time,
                    type: m.type,
                    locationOrLink: m.location_or_link,
                    createdAt: m.created_at
                })));
            }

            // Fetch projectFiles
            const projectFilesRes = await supabase.from('project_files').select('*').order('created_at', { ascending: false });
            if (projectFilesRes.error) console.error('Error fetching project_files:', projectFilesRes.error);
            else {
                setProjectFiles(projectFilesRes.data.map((pf: any) => ({
                    id: pf.id,
                    projectId: pf.project_id,
                    name: pf.name,
                    fileFormat: pf.file_format,
                    fileUrl: pf.file_url,
                    uploadedBy: pf.uploaded_by,
                    createdAt: pf.created_at
                })));
            }

            // Fetch timeEntries
            const timeEntriesRes = await supabase.from('time_entries').select('*').order('start_time', { ascending: false });
            if (timeEntriesRes.error) console.error('Error fetching time_entries:', timeEntriesRes.error);
            else {
                setTimeEntries(timeEntriesRes.data.map((te: any) => ({
                    id: te.id,
                    engineerId: te.engineer_id,
                    entryType: te.entry_type,
                    startTime: te.start_time,
                    endTime: te.end_time,
                    createdAt: te.created_at
                })));
            }

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
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'meetings' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'project_files' },
                () => { fetchData() }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'time_entries' },
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
            hourly_rate: project.hourlyRate,
            budget: project.budget || 0,
            phase: project.phase || 'Planning'
        });
        if (error) console.error('Error adding project:', error);
        else await fetchData();
    };

    const updateProject = async (project: Project) => {
        const { error } = await supabase.from('projects').update({
            name: project.name,
            hourly_rate: project.hourlyRate,
            budget: project.budget,
            phase: project.phase
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
        const { error } = await supabase.from('meetings').insert({
            id: meeting.id,
            title: meeting.title,
            description: meeting.description,
            date: meeting.date,
            time: meeting.time,
            type: meeting.type,
            location_or_link: meeting.locationOrLink
        });
        if (error) console.error('Error adding meeting:', error);
        else await fetchData();
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
        const { error } = await supabase.from('time_entries').update({
            end_time: entry.endTime
        }).eq('id', entry.id);
        if (error) console.error('Error updating time entry:', error);
        else await fetchData();
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
