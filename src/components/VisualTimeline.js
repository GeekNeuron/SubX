// src/components/VisualTimeline.js
import React from 'react';
import { srtTimeToMs } from '../utils/srtUtils';

function VisualTimeline({ subtitles, onSelectSubtitle, activeRowId, totalDuration, subtitleErrors }) {
    const containerRef = React.useRef(null);

    if (!subtitles || subtitles.length === 0) {
        return null;
    }

    // Calculate a reasonable total duration if not provided or if it's too short
    const effectiveTotalDuration = React.useMemo(() => {
        if (totalDuration && totalDuration > 0) return totalDuration;
        if (subtitles.length === 0) return 60000; // Default to 1 minute if no subtitles
        const lastSub = subtitles[subtitles.length - 1];
        return lastSub ? srtTimeToMs(lastSub.endTime) + 5000 : 60000; // Add 5s buffer or default to 1min
    }, [subtitles, totalDuration]);


    const handleBlockClick = (subId, subStartTime) => {
        onSelectSubtitle(subId);
        // Scroll timeline to center the clicked block
        if (containerRef.current) {
            const percentage = (subStartTime / effectiveTotalDuration) * 100;
            const scrollPosition = (containerRef.current.scrollWidth * percentage / 100) - (containerRef.current.clientWidth / 2);
            containerRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
        }
    };
    
    return (
        <div className="my-6">
            <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-300">Visual Timeline</h3>
            <div 
                ref={containerRef}
                className="w-full h-24 bg-slate-200 dark:bg-slate-700 rounded-md overflow-x-auto overflow-y-hidden relative whitespace-nowrap p-2"
            >
                {subtitles.map((sub, index) => {
                    const startMs = srtTimeToMs(sub.startTime);
                    const endMs = srtTimeToMs(sub.endTime);
                    const durationMs = Math.max(0, endMs - startMs); // Ensure duration is not negative

                    const leftPercentage = (startMs / effectiveTotalDuration) * 100;
                    const widthPercentage = (durationMs / effectiveTotalDuration) * 100;
                    
                    // Ensure minimum width for visibility, but don't let it exceed 100% - leftPercentage
                    const minWidthPx = 3; // Minimum width in pixels for very short subs
                    // Calculate width based on clientWidth if available, otherwise a small percentage
                    const clientWidth = containerRef.current ? containerRef.current.clientWidth : 1000; // Default to 1000 if not mounted yet
                    const minWidthPercent = (minWidthPx / clientWidth) * 100;

                    const calculatedWidth = Math.max(widthPercentage, minWidthPercent || 0.1);
                    const finalWidthPercentage = Math.min(calculatedWidth, 100 - leftPercentage);


                    const isSubActive = sub.id === activeRowId;
                    const hasError = subtitleErrors && subtitleErrors.has(sub.id); // Check if subtitleErrors is defined

                    let bgColorClass = isSubActive 
                        ? 'bg-sky-500 dark:bg-sky-400' 
                        : 'bg-sky-600/70 dark:bg-sky-500/70 hover:bg-sky-500 dark:hover:bg-sky-400';
                    if (hasError) {
                        bgColorClass = '!bg-red-500/80 dark:!bg-red-400/80'; // Use ! to ensure override
                    }

                    return (
                        <div
                            key={sub.id}
                            title={`${sub.startTime} - ${sub.endTime}\n${sub.text.substring(0, 50)}...`}
                            className={`absolute h-10 top-1/2 -translate-y-1/2 rounded cursor-pointer transition-all duration-150 ease-in-out
                                ${bgColorClass}
                                ${isSubActive ? 'ring-2 ring-sky-300 dark:ring-sky-200' : ''}
                            `}
                            style={{
                                left: `${leftPercentage}%`,
                                width: `${finalWidthPercentage}%`,
                                minWidth: `${minWidthPx}px` 
                            }}
                            onClick={() => handleBlockClick(sub.id, startMs)}
                        >
                           {/* Display subtitle index inside the block if it fits */}
                           {finalWidthPercentage > 1 && ( // Only show if width is somewhat reasonable
                                <span className="absolute text-[8px] p-0.5 text-white truncate left-1 top-0.5 select-none">
                                    {index + 1}
                                </span>
                           )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
export default VisualTimeline;
