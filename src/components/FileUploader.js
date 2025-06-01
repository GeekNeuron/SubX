// src/components/FileUploader.js
import React from 'react';

// All text is hardcoded in English
function FileUploader({ onFileLoad, setNotification, clearSubtitles, fileInputRef }) {
    const [fileName, setFileName] = React.useState('');
    const [selectedEncoding, setSelectedEncoding] = React.useState('UTF-8'); // Default to UTF-8

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) processFile(file);
        if(event.target) event.target.value = null; // Reset file input
    };

    const processFile = (file) => {
        setNotification({ message: "Loading file...", type: 'info', isLoading: true });
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const buffer = e.target.result;
                // Use TextDecoder for robust encoding support
                const decoder = new TextDecoder(selectedEncoding, { fatal: true }); // fatal:true will throw error for invalid sequences
                const content = decoder.decode(buffer);
                
                onFileLoad(content, file.name); // Pass decoded content to parent
                setNotification({ message: "Subtitles loaded successfully.", type: 'success', isLoading: false });
            } catch (error) {
                console.error("Error decoding/processing SRT:", error);
                setNotification({ message: `Error decoding file with ${selectedEncoding}. Invalid SRT format or encoding mismatch.`, type: 'error', isLoading: false });
                clearSubtitles(); // Clear any partially loaded or erroneous data
            }
        };
        reader.onerror = () => {
            setNotification({ message: "Error: Could not read file.", type: 'error', isLoading: false });
            clearSubtitles();
        };
        reader.readAsArrayBuffer(file); // Read as ArrayBuffer for TextDecoder
        setFileName(file.name);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('border-sky-500', 'bg-sky-50', 'dark:bg-slate-700');
        event.currentTarget.classList.add('border-slate-300', 'dark:border-slate-600');
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            processFile(event.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragEnter = (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('border-sky-500', 'bg-sky-50', 'dark:bg-slate-700');
        event.currentTarget.classList.remove('border-slate-300', 'dark:border-slate-600');
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!event.currentTarget.contains(event.relatedTarget)) {
            event.currentTarget.classList.remove('border-sky-500', 'bg-sky-50', 'dark:bg-slate-700');
            event.currentTarget.classList.add('border-slate-300', 'dark:border-slate-600');
        }
    };
    
    // Common encodings
    const encodings = [
        { value: 'UTF-8', label: 'Autodetect (UTF-8 default)' },
        { value: 'windows-1256', label: 'Windows-1256 (Arabic)' },
        { value: 'windows-1252', label: 'Windows-1252 (Western European)' },
        { value: 'windows-1250', label: 'Windows-1250 (Central European)' },
        { value: 'windows-1251', label: 'Windows-1251 (Cyrillic)' },
        { value: 'ISO-8859-1', label: 'ISO-8859-1 (Latin-1)' },
        { value: 'ISO-8859-2', label: 'ISO-8859-2 (Central European)' },
        // Add more encodings as needed and supported by TextDecoder
    ];

    return (
        <div className="my-4 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center transition-colors">
            <div 
                className="cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 p-4"
                onClick={() => fileInputRef.current?.click()} 
                onDrop={handleDrop} 
                onDragOver={handleDragOver} 
                onDragEnter={handleDragEnter} 
                onDragLeave={handleDragLeave}
            >
                <input type="file" id="fileInput" ref={fileInputRef} className="hidden" accept=".srt" onChange={handleFileChange} />
                <p className="text-slate-500 dark:text-slate-400">Drop .srt file here or click to upload</p>
                {fileName && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">File: {fileName}</p>}
                {!fileName && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No file selected</p>}
            </div>
            <div className="mt-3 text-sm">
                <label htmlFor="fileEncoding" className="mr-2 text-slate-700 dark:text-slate-300">File Encoding:</label>
                <select 
                    id="fileEncoding"
                    value={selectedEncoding}
                    onChange={(e) => setSelectedEncoding(e.target.value)}
                    className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-xs"
                >
                    {encodings.map(enc => <option key={enc.value} value={enc.value}>{enc.label}</option>)}
                </select>
            </div>
        </div>
    );
}

export default FileUploader;
