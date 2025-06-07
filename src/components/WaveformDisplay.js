// src/components/WaveformDisplay.js
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

function WaveformDisplay({ subtitle, isActive }) {
    const t = useTranslation();
    
    if (!isActive || !subtitle) {
        return null;
    }

    const waveformData = React.useMemo(() => {
        return Array.from({ length: 60 }, () => Math.random() * 0.7 + 0.1);
    }, [subtitle.id]); 

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
