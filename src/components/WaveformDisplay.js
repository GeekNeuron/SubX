// src/components/WaveformDisplay.js
import React from 'react';

// Displays a conceptual waveform for the active subtitle
function WaveformDisplay({ subtitle, isActive }) {
    if (!isActive || !subtitle) {
        return null;
    }

    // Generate a simple conceptual waveform: an array of random heights
    // This re-generates if the subtitle ID changes, indicating a new subtitle is active
    const waveformData = React.useMemo(() => {
        return Array.from({ length: 60 }, () => Math.random() * 0.7 + 0.1); // Values between 0.1 and 0.8
    }, [subtitle.id]); 

    return (
        <div className="my-4 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg shadow">
            <h4 className="text-xs font-medium mb-2 text-slate-600 dark:text-slate-400">
                Conceptual Waveform for: <span className="font-mono text-sky-600 dark:text-sky-400">{subtitle.startTime} - {subtitle.endTime}</span>
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
