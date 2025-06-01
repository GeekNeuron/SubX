// src/utils/srtUtils.js

// Converts SRT time format (HH:MM:SS,ms or HH:MM:SS.ms) to milliseconds.
export const srtTimeToMs = (timeStr) => {
    if (typeof timeStr !== 'string') return 0;
    // Regex to match both comma and dot as millisecond separator
    const parts = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!parts) {
        // Attempt to parse if only ms is missing (e.g., HH:MM:SS)
        const simplerParts = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (simplerParts) {
            return parseInt(simplerParts[1], 10) * 3600000 + 
                   parseInt(simplerParts[2], 10) * 60000 + 
                   parseInt(simplerParts[3], 10) * 1000;
        }
        console.warn(`Invalid time string format for srtTimeToMs: ${timeStr}`);
        return 0; // Return 0 or throw error for invalid format
    }
    return parseInt(parts[1], 10) * 3600000 + 
           parseInt(parts[2], 10) * 60000 + 
           parseInt(parts[3], 10) * 1000 + 
           parseInt(parts[4], 10);
};

// Converts milliseconds to SRT time format (HH:MM:SS,ms).
export const msToSrtTime = (totalMs) => {
    if (typeof totalMs !== 'number' || isNaN(totalMs) || totalMs < 0) totalMs = 0; 
    const ms = Math.floor(totalMs % 1000);
    const s = Math.floor(totalMs / 1000) % 60;
    const m = Math.floor(totalMs / 60000) % 60;
    const h = Math.floor(totalMs / 3600000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// Checks subtitles for common errors based on the provided configuration.
// Returns an error map with subtitle IDs as keys and an array of error keys as values.
export function checkSubtitleErrors(subtitles, currentErrorConfig) {
    const errorsMap = new Map();
    if (!subtitles || !Array.isArray(subtitles)) return errorsMap;

    subtitles.forEach((sub, index) => {
        if (!sub || typeof sub.startTime !== 'string' || typeof sub.endTime !== 'string' || typeof sub.text !== 'string') {
            console.warn("Invalid subtitle object encountered in checkSubtitleErrors:", sub);
            return; 
        }

        const subErrorKeys = []; // Store error keys instead of full messages
        const startTimeMs = srtTimeToMs(sub.startTime);
        const endTimeMs = srtTimeToMs(sub.endTime);
        const durationMs = endTimeMs - startTimeMs;

        if (startTimeMs > endTimeMs) subErrorKeys.push('ERROR_TIME_INVALID');
        
        if (index < subtitles.length - 1) {
            const nextSub = subtitles[index + 1];
             if (nextSub && typeof nextSub.startTime === 'string') {
                const nextStartTimeMs = srtTimeToMs(nextSub.startTime);
                if (endTimeMs > nextStartTimeMs) subErrorKeys.push('ERROR_TYPE_OVERLAP');
            }
        }
        if (durationMs >= 0 && durationMs < currentErrorConfig.MIN_DURATION_MS) {
            subErrorKeys.push('ERROR_TYPE_TOO_SHORT');
        }
        if (durationMs > currentErrorConfig.MAX_DURATION_MS) {
            subErrorKeys.push('ERROR_TYPE_TOO_LONG');
        }
        
        const lines = sub.text.split('\n');
        if (lines.length > currentErrorConfig.MAX_LINES) {
            subErrorKeys.push('ERROR_TYPE_TOO_MANY_LINES');
        }
        lines.forEach((line, lineIndex) => {
            if (line.length > currentErrorConfig.MAX_CHARS_PER_LINE) {
                // Store line number with the error key for more specific feedback
                subErrorKeys.push(`ERROR_TYPE_TOO_MANY_CHARS:${lineIndex + 1}`); 
            }
        });

        if (subErrorKeys.length > 0) errorsMap.set(sub.id, subErrorKeys);
    });
    return errorsMap;
}
