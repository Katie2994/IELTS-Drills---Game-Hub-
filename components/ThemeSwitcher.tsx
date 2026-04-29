import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../data/themes';

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

interface ThemeSwitcherProps {
  currentThemeName: string;
  onThemeChange: (themeName: string) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentThemeName, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const handleThemeClick = (themeName: string) => {
    onThemeChange(themeName);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentTheme = THEMES[currentThemeName];

  return (
    <div ref={switcherRef} className="fixed top-6 right-6 z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open theme switcher"
        className="w-12 h-12 rounded-full flex items-center justify-center text-white
                   shadow-lg transition-transform duration-300 ease-out hover:scale-110
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        style={{ 
          background: currentTheme.background.includes('gradient') ? undefined : currentTheme.background,
          backgroundImage: currentTheme.background.includes('gradient') ? currentTheme.background : undefined,
          backgroundSize: currentTheme.background.includes('gradient') ? '200%' : 'cover' 
        }}
      >
        <PaletteIcon />
      </button>

      <div
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="theme-switcher-button"
        className={`
          absolute top-full right-0 mt-2 w-48 p-2 rounded-xl shadow-2xl
          bg-black/20 backdrop-blur-lg border border-white/20
          transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]
          origin-top-right
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
      >
        <p className="text-white/70 text-xs font-bold tracking-wider px-2 pt-1 pb-2">Select Theme</p>
        {Object.entries(THEMES).map(([themeName, theme]) => (
          <button
            key={themeName}
            role="menuitem"
            onClick={() => handleThemeClick(themeName)}
            className={`
              w-full flex items-center p-2 rounded-lg text-left text-white/90 text-sm
              transition-colors duration-200 hover:bg-white/20
              focus:outline-none focus-visible:bg-white/20
            `}
          >
            <span
              className="w-5 h-5 rounded-full border-2 border-white/50 mr-3"
              style={{ 
                background: theme.background.includes('gradient') ? undefined : theme.background,
                backgroundImage: theme.background.includes('gradient') ? theme.background : undefined 
              }}
            ></span>
            <span>{theme.name}</span>
            {currentThemeName === themeName && (
              <span className="ml-auto w-2 h-2 bg-white rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;