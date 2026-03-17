/**
 * Parses strings formatted like "English Text (Arabic Text)" or "English Text / Arabic Text"
 * and returns the appropriate translation based on the selected language.
 *
 * @param text The bilingual string
 * @param lang The target language 'en' or 'ar'
 * @returns The parsed text segment
 */
export const getLocalizedText = (text: string, lang: 'en' | 'ar'): string => {
    if (!text) return '';

    // Check for "English / Arabic" pattern
    if (text.includes(' / ')) {
        const parts = text.split(' / ');
        if (parts.length >= 2) {
            return lang === 'en' ? parts[0].trim() : parts[1].trim();
        }
    }

    // Check for "English (Arabic)" pattern
    const match = text.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const english = match[1].trim();
        const arabic = match[2].trim();
        return lang === 'en' ? english : arabic;
    }

    // Fallback: return the original text if no pattern matches
    return text;
};
