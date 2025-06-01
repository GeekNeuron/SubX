// src/utils/srtUtils.js

// Converts SRT time format (HH:MM:SS,ms) to milliseconds.
export const srtTimeToMs = (timeStr) => {
    if (typeof timeStr !== 'string') return 0;
    const parts = timeStr.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!parts) {
        // Attempt to parse if only ms is missing (e.g., HH:MM:SS)
        const simplerParts = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (simplerParts) {
            return parseInt(simplerParts[1], 10) * 3600000 + 
                   parseInt(simplerParts[2], 10) * 60000 + 
                   parseInt(simplerParts[3], 10) * 1000;
        }
        return 0;
    }
    return parseInt(parts[1], 10) * 3600000 + 
           parseInt(parts[2], 10) * 60000 + 
           parseInt(parts[3], 10) * 1000 + 
           parseInt(parts[4], 10);
};

// Converts milliseconds to SRT time format (HH:MM:SS,ms).
export const msToSrtTime = (totalMs) => {
    if (typeof totalMs !== 'number' || isNaN(totalMs) || totalMs < 0) totalMs = 0; 
    const ms = Math.floor(totalMs % 1000); // Use Math.floor to avoid potential floating point issues
    const s = Math.floor(totalMs / 1000) % 60;
    const m = Math.floor(totalMs / 60000) % 60;
    const h = Math.floor(totalMs / 3600000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// Checks subtitles for common errors based on the provided configuration.
// The 't' function is passed for localization of error messages.
export function checkSubtitleErrors(subtitles, currentErrorConfig, t) {
    const errorsMap = new Map();
    if (!subtitles || !Array.isArray(subtitles)) return errorsMap;

    subtitles.forEach((sub, index) => {
        if (!sub || typeof sub.startTime !== 'string' || typeof sub.endTime !== 'string' || typeof sub.text !== 'string') {
            console.warn("Invalid subtitle object encountered in checkSubtitleErrors:", sub);
            return; // Skip invalid subtitle objects
        }

        const subErrors = [];
        const startTimeMs = srtTimeToMs(sub.startTime);
        const endTimeMs = srtTimeToMs(sub.endTime);
        const durationMs = endTimeMs - startTimeMs;

        if (startTimeMs > endTimeMs) subErrors.push(t('errorTimeInvalid'));
        
        // Check for overlap with the next subtitle
        if (index < subtitles.length - 1) {
            const nextSub = subtitles[index + 1];
             if (nextSub && typeof nextSub.startTime === 'string') { // Check if nextSub and its startTime are valid
                const nextStartTimeMs = srtTimeToMs(nextSub.startTime);
                if (endTimeMs > nextStartTimeMs) subErrors.push(t('errorTypeOverlap'));
            }
        }
        // Check duration constraints
        if (durationMs >= 0 && durationMs < currentErrorConfig.MIN_DURATION_MS) {
            subErrors.push(t('errorTypeTooShort', durationMs, currentErrorConfig.MIN_DURATION_MS));
        }
        if (durationMs > currentErrorConfig.MAX_DURATION_MS) {
            subErrors.push(t('errorTypeTooLong', durationMs, currentErrorConfig.MAX_DURATION_MS));
        }
        
        const lines = sub.text.split('\n');
        // Check max lines per subtitle
        if (lines.length > currentErrorConfig.MAX_LINES) {
            subErrors.push(t('errorTypeTooManyLines', lines.length, currentErrorConfig.MAX_LINES));
        }
        // Check max characters per line
        lines.forEach((line, lineIndex) => {
            if (line.length > currentErrorConfig.MAX_CHARS_PER_LINE) {
                subErrors.push(t('errorTypeTooManyChars', line.length, currentErrorConfig.MAX_CHARS_PER_LINE, lineIndex + 1));
            }
        });

        if (subErrors.length > 0) errorsMap.set(sub.id, subErrors);
    });
    return errorsMap;
}
