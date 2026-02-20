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
}

export interface AppData {
    projects: Project[];
    engineers: Engineer[];
    entries: LogEntry[];
    attendance: AttendanceRecord[];
}
