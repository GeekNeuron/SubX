// src/contexts/ThemeContext.js
import React from 'react';

const ThemeContext = React.createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = React.useState(() => {
        const savedTheme = localStorage.getItem('subx-theme');
        return savedTheme || 'light'; // Default to light theme
    });

    React.useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
        localStorage.setItem('subx-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = React.useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
