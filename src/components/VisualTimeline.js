import React from 'react';
import { srtTimeToMs } from '../utils/srtUtils';
import { useTranslation } from '../contexts/LanguageContext';

function VisualTimeline({ subtitles, onSelectSubtitle, activeRowId, totalDuration, subtitleErrors, currentTime }) {
    const t = useTranslation();
    const containerRef = React.useRef(null);
    const playheadRef = React.useRef(null);
    
    React.useEffect(() => {
        if(playheadRef.current && totalDuration > 0 && currentTime >= 0){
            const percentage = (currentTime / totalDuration) * 100;
            playheadRef.current.style.left = `${percentage}%`;
        }
    }, [currentTime, totalDuration]);


    if (!subtitles || subtitles.length === 0) {
        return (
            <div className="my-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-300">{t('visualTimeline')}</h3>
                <div className="w-full h-24 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400">
                    {t('noSubtitlesLoaded')}
                </div>
            </div>
        );
    }

    const effectiveTotalDuration = React.useMemo(() => {
        if (totalDuration && totalDuration > 1000) return totalDuration;
        if (subtitles.length === 0) return 60000;
        const lastSub = subtitles[subtitles.length - 1];
        const maxEndTime = lastSub ? srtTimeToMs(lastSub.endTime) : 0;
        return Math.max(maxEndTime + 5000, 60000);
    }, [subtitles, totalDuration]);


    const handleBlockClick = (subId, subStartTime) => {
        onSelectSubtitle(subId);
        if (containerRef.current) {
            const percentage = (subStartTime / effectiveTotalDuration) * 100;
            const containerWidth = containerRef.current.clientWidth;
            const scrollPosition = (containerRef.current.scrollWidth * percentage / 100) - (containerWidth / 2);
            containerRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
        }
    };
    
    return (
        <div className="my-6">
            <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-300">{t('visualTimeline')}</h3>
            <div 
                ref={containerRef}
                className="w-full h-24 bg-slate-200 dark:bg-slate-700 rounded-md overflow-x-auto overflow-y-hidden relative whitespace-nowrap p-2 select-none"
            >
                <div ref={playheadRef} className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"></div>
                {subtitles.map((sub, index) => {
                    const startMs = srtTimeToMs(sub.startTime);
                    const endMs = srtTimeToMs(sub.endTime);
                    const durationMs = Math.max(50, endMs - startMs);
                    const leftPercentage = (startMs / effectiveTotalDuration) * 100;
                    const widthPercentage = (durationMs / effectiveTotalDuration) * 100;
                    const minWidthPx = 3;
                    const containerClientWidth = containerRef.current ? containerRef.current.clientWidth : 1000;
                    const minWidthAsPercentage = (minWidthPx / containerClientWidth) * 100;
                    const calculatedWidth = Math.max(widthPercentage, minWidthAsPercentage || 0.1);
                    const finalWidthPercentage = Math.min(calculatedWidth, 100 - leftPercentage);

                    const isSubActive = sub.id === activeRowId;
                    const hasError = subtitleErrors && subtitleErrors.has(sub.id); 

                    let bgColorClass = isSubActive 
                        ? 'bg-sky-500 dark:bg-sky-400' 
                        : 'bg-sky-600/70 dark:bg-sky-500/70 hover:bg-sky-500 dark:hover:bg-sky-400';
                    if (hasError) bgColorClass = '!bg-red-500/80 dark:!bg-red-400/80';

                    return (
                        <div
                            key={sub.id}
                            title={`#${index + 1}: ${sub.startTime} --> ${sub.endTime}\n${sub.text.substring(0, 100)}...`}
                            className={`absolute h-10 top-1/2 -translate-y-1/2 rounded cursor-pointer transition-all duration-150 ease-in-out z-10
                                ${bgColorClass}
                                ${isSubActive ? 'ring-2 ring-offset-1 ring-sky-300 dark:ring-offset-slate-700 dark:ring-sky-200' : ''}
                            `}
                            style={{
                                left: `${leftPercentage}%`,
                                width: `${finalWidthPercentage}%`,
                                minWidth: `${minWidthPx}px` 
                            }}
                            onClick={() => handleBlockClick(sub.id, startMs)}
                        >
                           {finalWidthPercentage > 1.5 && ( 
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
