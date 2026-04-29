import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FOLDER_DATA } from './data/folders';
import { THEMES } from './data/themes';
import { OPEN_SOUND_DATA_URL, CLOSE_SOUND_DATA_URL, HOVER_SOUND_DATA_URL, SEARCH_SOUND_DATA_URL } from './assets/sounds';
import FolderBox from './components/FolderBox';
import FolderContent from './components/FolderContent';
import SearchBar from './components/SearchBar';
import DrillsShowcase from './components/DrillsShowcase';
import Footer from './components/Footer';
import BackgroundEffects from './components/BackgroundEffects';
import ThemeSwitcher from './components/ThemeSwitcher';
import { LayoutGrid, Star } from 'lucide-react';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState<'explorer' | 'showcase'>('explorer');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [themeName, setThemeName] = useState<string>(() => {
    try {
      const savedTheme = window.localStorage.getItem('app-theme');
      return savedTheme && THEMES[savedTheme] ? savedTheme : 'default';
    } catch (error) {
      console.error("Could not read from localStorage", error);
      return 'default';
    }
  });

  const backgroundRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem('app-theme', themeName);
    } catch (error) {
      console.error("Could not write to localStorage", error);
    }
  }, [themeName]);

  const currentTheme = useMemo(() => THEMES[themeName], [themeName]);

  const themedFolderData = useMemo(() => {
    return FOLDER_DATA.map((folder, index) => {
      let colorScheme = currentTheme.folderColors[index % currentTheme.folderColors.length];
      
      let textColor = 'text-white/90';
      
      if (folder.category === 'Drills Originals') {
        if (themeName === 'default') {
          colorScheme = {
            color: 'bg-[#ffe36d]/80',
            borderColor: 'border-[#eec822]/80'
          };
          textColor = 'text-black';
        } else {
          colorScheme = {
            color: 'bg-red-600/80',
            borderColor: 'border-red-500/80'
          };
        }
      }

      return {
        ...folder,
        color: colorScheme.color,
        borderColor: colorScheme.borderColor,
        textColor: textColor,
      };
    });
  }, [currentTheme, themeName]);

  const openAudio = useMemo(() => {
    const audio = new Audio(OPEN_SOUND_DATA_URL);
    audio.volume = 0.4;
    return audio;
  }, []);

  const closeAudio = useMemo(() => {
    const audio = new Audio(CLOSE_SOUND_DATA_URL);
    audio.volume = 0.3;
    return audio;
  }, []);

  const hoverAudio = useMemo(() => {
    const audio = new Audio(HOVER_SOUND_DATA_URL);
    audio.volume = 0.2;
    return audio;
  }, []);

  const searchAudio = useMemo(() => {
    const audio = new Audio(SEARCH_SOUND_DATA_URL);
    audio.volume = 0.3;
    return audio;
  }, []);

  // Effect to detect the first user interaction to unlock audio
  useEffect(() => {
    const unlockAudio = () => {
      hasInteractedRef.current = true;
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const foldersWithOriginalIndex = useMemo(() =>
    themedFolderData.map((folder, index) => ({ ...folder, originalIndex: index })),
    [themedFolderData]
  );

  const filteredFolders = useMemo(() => {
    if (!searchTerm) {
      return foldersWithOriginalIndex;
    }
    return foldersWithOriginalIndex.filter(folder =>
      folder.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, foldersWithOriginalIndex]);

  useEffect(() => {
    setActiveIndex(null);
  }, [searchTerm]);

  const categorizedFolders = useMemo(() => {
    const groups: { [key: string]: typeof foldersWithOriginalIndex } = {};
    filteredFolders.forEach((folder) => {
      const cat = folder.category || 'Khác';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(folder);
    });
    return groups;
  }, [filteredFolders]);

  const categories = useMemo(() => Object.keys(categorizedFolders), [categorizedFolders]);

  const activeFolderData = useMemo(() => {
    if (activeIndex === null) return null;
    return foldersWithOriginalIndex.find(f => f.originalIndex === activeIndex) || null;
  }, [activeIndex, foldersWithOriginalIndex]);

  const handleFolderClick = (index: number) => {
    openAudio.pause();
    openAudio.currentTime = 0;
    closeAudio.pause();
    closeAudio.currentTime = 0;

    setActiveIndex(prevIndex => {
      if (prevIndex === index) {
        closeAudio.play().catch(e => console.error("Error playing close sound:", e));
        return null;
      } else {
        openAudio.play().catch(e => console.error("Error playing open sound:", e));
        return index;
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeIndex !== null) {
        closeAudio.play().catch(e => console.error("Error playing close sound:", e));
        setActiveIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, closeAudio]);

  // Debounced search sound effect
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    const handler = setTimeout(() => {
      if (hasInteractedRef.current) {
        searchAudio.play().catch(e => console.error("Error playing search sound:", e));
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, searchAudio]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const xPercent = (clientX / innerWidth) * 100;
      const yPercent = (clientY / innerHeight) * 100;

      requestAnimationFrame(() => {
        if (backgroundRef.current) {
          backgroundRef.current.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleFolderHover = () => {
    if (!hasInteractedRef.current) return;
    hoverAudio.currentTime = 0;
    hoverAudio.play().catch(e => console.error("Error playing hover sound:", e));
  };


  return (
    <main
      className="relative min-h-screen font-sans overflow-y-auto bg-black scroll-smooth"
    >
      <div
        ref={backgroundRef}
        className="absolute inset-0"
        style={{
            background: currentTheme.background.includes('gradient') ? undefined : currentTheme.background,
            backgroundImage: currentTheme.background.includes('gradient') ? currentTheme.background : undefined,
            backgroundSize: currentTheme.background.includes('gradient') ? '400% 400%' : 'cover',
            transition: 'background-position 0.5s ease-out',
        }}
        aria-hidden="true"
      />

      <div className="relative backdrop-blur-lg flex flex-col min-h-screen">
        <BackgroundEffects />
        <ThemeSwitcher currentThemeName={themeName} onThemeChange={setThemeName} />
        
        {view === 'showcase' ? (
          <DrillsShowcase onBack={() => setView('explorer')} />
        ) : (
        <div className="relative z-10 flex flex-col flex-1 pb-24">
            <div 
              className={`w-full flex justify-center pt-24 mb-16 transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
              style={{ fontFamily: '"Segoe UI", Roboto, sans-serif' }}
            >
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 space-y-48">
              {categories.map((category) => (
                <div key={category} className="flex flex-col items-center">
                  <div className="mb-20 flex flex-col items-center text-center">
                    <h2 
                      className={`text-3xl font-bold tracking-[0.1em] uppercase drop-shadow-2xl ${
                        category === 'Drills Originals' && themeName === 'default'
                          ? 'text-[#ffe36d]' 
                          : 'text-white/90'
                      }`}
                      style={{ fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                    >
                      {category}
                    </h2>
                    <div className={`mt-4 w-20 h-1.5 rounded-full ${
                      category === 'Drills Originals' && themeName === 'default'
                        ? 'bg-gradient-to-r from-transparent via-[#ffe36d] to-transparent shadow-[0_0_15px_rgba(255,227,109,0.5)]'
                        : 'bg-gradient-to-r from-transparent via-white/40 to-transparent shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    }`} />
                    
                    {category === 'Drills Originals' && (
                      <button
                        onClick={() => setView('showcase')}
                        className={`mt-10 flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-wider transition-all shadow-xl hover:scale-105 ${
                          themeName === 'default'
                            ? 'bg-[#ffe36d] text-black shadow-[0_0_20px_rgba(255,227,109,0.4)]'
                            : 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                        }`}
                      >
                        <Star size={20} className={themeName === 'default' ? 'text-black fill-black' : 'text-[#ffe36d] fill-[#ffe36d]'} />
                        <span style={{ fontFamily: '"Segoe UI", Roboto, sans-serif' }}>Vào trang Showcase</span>
                      </button>
                    )}
                  </div>

                  <div className="relative flex flex-col items-center" style={{ perspective: '2000px' }}>
                    <div className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${activeFolderData && activeFolderData.category === category ? 'scale-110 -translate-y-12' : 'scale-100 translate-y-0'}`}>
                      <FolderBox
                        folders={categorizedFolders[category]}
                        activeIndex={activeIndex}
                        onFolderClick={handleFolderClick}
                        onFolderHover={handleFolderHover}
                        isLoaded={isLoaded}
                      />
                    </div>
                    
                    {activeFolderData && activeFolderData.category === category && (
                      <div className="w-full flex justify-center mt-32">
                        <FolderContent
                          data={{ ...activeFolderData.content, gameUrl: activeFolderData.gameUrl }}
                          isActive={true}
                          borderColor={activeFolderData.borderColor}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 text-white/30 font-mono italic tracking-widest text-lg animate-pulse">
                  &lt; No matches found /&gt;
                </div>
              )}
            </div>
          </div>
        )}

        <div className="py-12 bg-black/40 border-t border-white/5 backdrop-blur-xl">
          <Footer filteredCount={filteredFolders.length} totalCount={FOLDER_DATA.length} />
        </div>
      </div>
    </main>
  );
}