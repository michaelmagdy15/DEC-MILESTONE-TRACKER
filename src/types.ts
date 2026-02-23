export interface Project {
    id: string;
    name: string;
    hourlyRate?: number;
}

export interface Engineer {
    id: string;
    name: string;
    role: string;
    hourlyRate?: number;
    weeklyGoalHours?: number;
}

export interface Milestone {
    id: string;
    projectId: string;
    name: string;
    targetDate?: string;
    completedPercentage: number;
    createdAt?: string;
}

export interface Task {
    id: string;
    projectId: string;
    milestoneId?: string;
    engineerId?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    dueDate?: string;
    createdAt?: string;
}

export interface LeaveRequest {
    id: string;
    engineerId: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
}

export interface Notification {
    id: string;
    engineerId: string;
    message: string;
    isRead: boolean;
    createdAt?: string;
}

export interface AttendanceRecord {
    id: string;
    engineerId: string;
    date: string; // ISO string YYYY-MM-DD
    status: 'Present' | 'Absent' | 'Half-Day';
}

export interface LogEntry {
    id: string;
    projectId: string;
    engineerId: string;
    date: string; // ISO string YYYY-MM-DD
    taskDescription: string;
    softwareUsed: string[];
    timeSpent: number;
    milestone?: string;
    tags?: string[];
}

export interface AppData {
    projects: Project[];
    engineers: Engineer[];
    entries: LogEntry[];
    attendance: AttendanceRecord[];
    milestones: Milestone[];
    tasks: Task[];
    leaveRequests: LeaveRequest[];
    notifications: Notification[];
}
