import React, { useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext.js';

function WaveformDisplay({ subtitle, isActive }) {
    const t = useTranslation();
    
    // HOOK MOVED HERE: The hook is now called at the top level, before any conditional returns.
    const waveformData = useMemo(() => {
        // Only generate data if there's a subtitle, otherwise return an empty array
        if (!subtitle) return [];
        return Array.from({ length: 60 }, () => Math.random() * 0.7 + 0.1);
    }, [subtitle]); // Dependency is now on the whole subtitle object

    // CONDITIONAL RETURN IS NOW AFTER THE HOOK
    if (!isActive || !subtitle) {
        return null; 
    }

    return (
        <div className="my-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
            <h4 className="text-xs font-medium mb-2 text-slate-600 dark:text-slate-400">
                {t('waveformDisplay')}: <span className="font-mono text-sky-600 dark:text-sky-400">{subtitle.startTime} - {subtitle.endTime}</span>
            </h4>
            <div className="w-full h-16 bg-slate-200 dark:bg-slate-700 rounded flex items-end justify-start overflow-hidden px-0.5 space-x-px">
                {waveformData.map((height, index) => (
                    <div
                        key={index}
                        className="bg-sky-500 dark:bg-sky-400 rounded-sm flex-grow"
                        style={{
                            height: `${height * 100}%`,
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
}

export default WaveformDisplay;
