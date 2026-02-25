declare module 'jspdf-autotable' {
    import type jsPDF from 'jspdf';

    interface AutoTableOptions {
        head?: any[][];
        body?: any[][];
        startY?: number;
        theme?: 'striped' | 'grid' | 'plain';
        headStyles?: Record<string, any>;
        [key: string]: any;
    }

    export default function autoTable(doc: jsPDF, options: AutoTableOptions): void;
}
