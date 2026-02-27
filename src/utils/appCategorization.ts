export const DEEP_WORK_PROGRAMS = [
    "AutoCAD", "Revit", "ETABS", "SAFE", "SketchUp", "Lumion", "Twinmotion", "3ds Max", "Archicad", "Civil 3D", "Rhino", "SolidWorks", "Bluebeam", "Navisworks"
];

export const COMMUNICATION_PROGRAMS = [
    "Outlook", "Teams", "Zoom", "Slack", "Skype", "Discord", "Webex", "Meet"
];

export type AppCategory = 'Deep Work' | 'Communication' | 'Admin/Doc' | 'Browsing/Other';

export const categorizeApp = (windowTitle: string): AppCategory => {
    const title = windowTitle.toLowerCase();

    if (DEEP_WORK_PROGRAMS.some(p => title.includes(p.toLowerCase()))) {
        return 'Deep Work';
    }
    if (COMMUNICATION_PROGRAMS.some(p => title.includes(p.toLowerCase()))) {
        return 'Communication';
    }
    if (["excel", "powerpoint", "word", "pdf", "acrobat", "project"].some(p => title.includes(p))) {
        return 'Admin/Doc';
    }
    return 'Browsing/Other';
};
