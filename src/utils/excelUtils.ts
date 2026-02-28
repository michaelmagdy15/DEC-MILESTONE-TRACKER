/**
 * Shared Excel report utilities for consistent workbook setup, styling, and export.
 * Eliminates copy-paste duplication between financial reports and invoices.
 */

export interface WorkbookSetupOptions {

    sheetName: string;
    columns: Array<{ width: number }>;
    maxRows?: number; // Number of rows to pre-fill with white background
}

/**
 * Dynamically imports exceljs and file-saver to reduce initial bundle size.
 */
export const loadExcelDependencies = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const fileSaver = await import('file-saver');
    const saveAs = fileSaver.default?.saveAs ?? fileSaver.saveAs;
    return { ExcelJS, saveAs };
};

/**
 * Creates a workbook and worksheet with clean white styling and standard metadata.
 */
export const createStyledWorkbook = async (options: WorkbookSetupOptions) => {
    const { ExcelJS, saveAs } = await loadExcelDependencies();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DEC Milestone Tracker';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(options.sheetName, {
        views: [{ showGridLines: false }]
    });

    worksheet.columns = options.columns.map(c => ({ width: c.width }));

    // Clean white background for all rows
    const maxRows = options.maxRows || 100;
    for (let i = 1; i <= maxRows; i++) {
        worksheet.getRow(i).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }
        };
    }

    return { workbook, worksheet, saveAs };
};

/**
 * Attempts to embed the DEC logo into the worksheet.
 * Falls back to a styled text header if the logo cannot be loaded.
 */
export const embedLogo = async (
    workbook: any,
    worksheet: any,
    options?: { fallbackMerge?: string; logoPosition?: { col: number; row: number } }
) => {
    const fallbackMerge = options?.fallbackMerge || 'B2:C3';
    const logoPos = options?.logoPosition || { col: 1, row: 1 };

    try {
        const base64Png = await convertSvgToPng('/dec-logo.svg');
        const imageId = workbook.addImage({ base64: base64Png, extension: 'png' });
        worksheet.addImage(imageId, {
            tl: { col: logoPos.col, row: logoPos.row },
            ext: { width: 150, height: 40 }
        });
    } catch {
        worksheet.mergeCells(fallbackMerge);
        const logoCell = worksheet.getCell(fallbackMerge.split(':')[0]);
        logoCell.value = 'DEC Engineering Consultants';
        logoCell.font = { name: 'Arial', family: 2, size: 16, bold: true, color: { argb: 'FFD35400' } };
    }
};

/**
 * Converts an SVG image path to a base64 PNG data URL.
 */
const convertSvgToPng = (svgPath: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = Math.floor(300 * (img.height / img.width));
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#1e1e1e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 10, 10, canvas.width - 20, canvas.height - 20);
                resolve(canvas.toDataURL('image/png'));
            } else {
                reject(new Error('No canvas context'));
            }
        };
        img.onerror = () => reject(new Error(`Failed to load image: ${svgPath}`));
        img.src = svgPath;
    });
};

/**
 * Writes a styled table header row.
 */
export const writeTableHeader = (
    worksheet: any,
    row: number,
    columns: string[],
    headers: string[],
    options?: { bgColor?: string; fontColor?: string; rightAlignFrom?: number }
) => {
    const bgColor = options?.bgColor || 'FFEA580C';
    const fontColor = options?.fontColor || 'FFFFFFFF';
    const rightAlignFrom = options?.rightAlignFrom ?? headers.length;

    headers.forEach((h, i) => {
        const cell = worksheet.getCell(`${columns[i]}${row}`);
        cell.value = h;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: fontColor } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle', horizontal: i >= rightAlignFrom ? 'right' : 'left' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
    });
};

/**
 * Exports a workbook to an xlsx file download.
 */
export const exportWorkbook = async (
    workbook: any,
    saveAs: (blob: Blob, fileName: string) => void,
    fileName: string
) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, fileName);
};
