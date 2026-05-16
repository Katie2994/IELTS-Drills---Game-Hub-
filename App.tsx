import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FOLDER_DATA } from './data/folders';
import { THEMES } from './data/themes';
import { OPEN_SOUND_DATA_URL, CLOSE_SOUND_DATA_URL } from './assets/sounds';
import Folder from './components/Folder';
import Icon from './components/Icon';

const BGM_URL = "https://cdn.pixabay.com/audio/2022/10/25/audio_51bf12f458.mp3"; // royalty free synthwave/epic game intro

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  const categories = useMemo(() => {
    const cats = Array.from(new Set(FOLDER_DATA.map(f => f.category))).filter((c): c is string => !!c && c !== 'Drills Originals');
    return ['All', 'Drills Originals', ...cats];
  }, []);

  const [activeIndex, setActiveIndex] = useState<number | null>(FOLDER_DATA[0]?.title ? 0 : null);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false); // start off, until interaction

  const hasInteractedRef = useRef(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    bgmRef.current = new Audio(BGM_URL);
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.15;

    const unlockAudio = () => {
      if (!hasInteractedRef.current) {
         hasInteractedRef.current = true;
         bgmRef.current?.play().then(() => setIsBgmPlaying(true)).catch(() => {});
      }
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (bgmRef.current) {
        bgmRef.current.pause();
      }
    };
  }, []);

  const toggleBgm = () => {
    if (bgmRef.current) {
      if (isBgmPlaying) {
        bgmRef.current.pause();
      } else {
        bgmRef.current.play().catch(console.error);
      }
    }
    setIsBgmPlaying(!isBgmPlaying);
  };

  const filteredFolders = useMemo(() => {
    const list = FOLDER_DATA.map((f, i) => ({ ...f, originalIndex: i }))
                            .filter(f => {
                                const matchSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase());
                                const matchCat = activeCategory === 'All' || f.category === activeCategory;
                                return matchSearch && matchCat;
                            });

    return list.map((folder, index) => {
      let colorScheme = THEMES.default.folderColors[index % THEMES.default.folderColors.length];
      let textColor = 'text-white/90';
      if (folder.category === 'Drills Originals') {
        colorScheme = {
          color: 'bg-[#ffe36d]/80',
          borderColor: 'border-[#eec822]/80'
        };
        textColor = 'text-black';
      }
      return {
        ...folder,
        color: colorScheme.color,
        borderColor: colorScheme.borderColor,
        textColor: textColor,
      };
    });
  }, [searchTerm, activeCategory]);

  useEffect(() => {
     if (filteredFolders.length > 0) {
        const activeExists = filteredFolders.some(f => f.originalIndex === activeIndex);
        if (!activeExists) {
           setActiveIndex(filteredFolders[0].originalIndex);
        }
     } else {
        setActiveIndex(null);
     }
  }, [filteredFolders, activeIndex]);

  const activeRenderIndex = useMemo(() => {
    if (activeIndex === null) return 0;
    const idx = filteredFolders.findIndex(f => f.originalIndex === activeIndex);
    return Math.max(0, idx);
  }, [activeIndex, filteredFolders]);

  const activeFolderData = filteredFolders[activeRenderIndex] || null;

  const playSound = (audio: HTMLAudioElement, name: string) => {
    if (!hasInteractedRef.current) return;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
          console.error(`Error playing ${name} sound:`, e);
        }
      });
    }
  };

  const handleFolderClick = (index: number) => {
    setActiveIndex(prevIndex => {
      if (prevIndex === index) {
        playSound(closeAudio, 'close');
        return index; // we want it to stay selected, basically "focus" it
      } else {
        playSound(openAudio, 'open');
        return index;
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 10) {
       if (activeRenderIndex < filteredFolders.length - 1) {
          handleFolderClick(filteredFolders[activeRenderIndex + 1].originalIndex);
       }
    } else if (e.deltaY < -10) {
       if (activeRenderIndex > 0) {
          handleFolderClick(filteredFolders[activeRenderIndex - 1].originalIndex);
       }
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#050505] text-white overflow-hidden font-mono selection:bg-white/30" onWheel={handleWheel}>
      
      {/* Dynamic Background Blob based on active folder */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] rounded-full blur-[100px] opacity-20 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{ 
          background: activeFolderData?.category === 'Drills Originals' ? '#eec822' : '#3b82f6',
          transform: `translate(-50%, -50%) scale(${isLoaded ? 1.2 : 0.8})`
        }} 
      />

      {/* Header, Search, Categories */}
      <div className="fixed top-8 left-10 tracking-[0.2em] text-[11px] text-white/30 uppercase z-30 pointer-events-auto">
        IELTS Drills / <span className="text-[#7DF9FF]">Albums</span>
      </div>
      
      <div className="fixed top-[60px] left-10 w-[380px] z-30 flex flex-col gap-4 pointer-events-auto">
         <input 
            type="text" 
            placeholder="Search game..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-[#7DF9FF] transition-colors font-mono shadow-lg placeholder:text-white/20"
         />
         
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
               <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full font-mono transition-colors border shadow-md ${activeCategory === cat ? 'bg-[#7DF9FF] text-black border-[#7DF9FF] font-bold' : 'bg-black/50 text-white/60 border-white/10 hover:text-white hover:border-white/30 backdrop-blur-md'}`}
               >
                  {cat}
               </button>
            ))}
         </div>
      </div>

      <div className="fixed top-8 right-10 z-30 flex items-center gap-6 pointer-events-auto">
         <div className="tracking-[0.1em] text-[11px] text-white/30 drop-shadow-md">
            {filteredFolders.length} TRACKS
         </div>
         <button 
           onClick={toggleBgm}
           className="p-2 rounded-full bg-white/5 hover:bg-white/20 border border-white/20 transition-all text-sm shadow-[0_0_10px_rgba(255,255,255,0.1)]"
           title="Toggle BGM"
         >
           {isBgmPlaying ? '🔊' : '🔇'}
         </button>
      </div>

      <div className="fixed bottom-[140px] right-10 text-[10px] text-white/25 tracking-[0.1em] animate-pulse z-20 [writing-mode:vertical-rl]">
        SCROLL TO BROWSE
      </div>

      {/* Main 3D Canvas / Stack */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center pl-[15vw]">
         <div className="relative w-full h-full" style={{ perspective: '1200px' }}>
            <div className="absolute top-[45%] left-[55%]" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-25deg) rotateX(5deg)' }}>
               {filteredFolders.map((folder, index) => {
                  const relIdx = index - activeRenderIndex;
                  if (Math.abs(relIdx) > 20) return null;
                  
                  return (
                     <Folder 
                        key={folder.originalIndex}
                        renderIndex={index}
                        data={folder}
                        activeIndex={activeIndex}
                        activeRenderIndex={activeRenderIndex}
                        totalRendered={filteredFolders.length}
                        onClick={() => handleFolderClick(folder.originalIndex)}
                        onHover={() => {}}
                        isLoaded={isLoaded}
                     />
                  )
               })}
            </div>
         </div>
      </div>

      {/* Track List */}
      <div className="fixed left-0 top-[180px] w-[500px] h-[calc(100vh-320px)] flex flex-col justify-center pl-10 pointer-events-none z-10" style={{ perspective: '800px' }}>
         {filteredFolders.map((folder, index) => {
             const relIdx = index - activeRenderIndex;
             const absIdx = Math.abs(relIdx);
             if (absIdx > 10) return null;

             const isActive = index === activeRenderIndex;
             const scale = 1 - absIdx * 0.05;
             const opacity = Math.max(0.1, 1 - absIdx * 0.15);
             const translateX = absIdx * 5;

             return (
               <div 
                 key={folder.originalIndex}
                 className={`relative flex flex-col my-[5px] py-1 cursor-pointer pointer-events-auto transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] group ${isActive ? 'active' : ''}`}
                 style={{
                   transform: `scale(${scale}) translateX(${translateX}px)`,
                   opacity,
                   transformOrigin: 'left center'
                 }}
                 onClick={() => handleFolderClick(folder.originalIndex)}
               >
                  {/* indicator line */}
                  <div 
                     className="absolute -left-6 top-1/2 h-px -translate-y-1/2 transition-all duration-300"
                     style={{ 
                        width: isActive ? '20px' : '0px', 
                        backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                        opacity: isActive ? 1 : 0
                     }} 
                  />
                  
                  <div className={`font-mono text-[16px] md:text-[20px] font-bold truncate max-w-[420px] tracking-[0.02em] transition-colors duration-300 leading-[1.2] ${isActive ? 'text-[#7DF9FF] drop-shadow-[0_0_8px_rgba(125,249,255,0.5)]' : 'text-white/85 group-hover:text-white'}`}>
                    {folder.title}
                  </div>
                  <div className={`font-mono text-[11px] md:text-[13px] font-normal truncate max-w-[420px] tracking-[0.05em] transition-colors duration-300 leading-[1.3] mt-[2px] ${isActive ? 'text-white/70' : 'text-white/40 group-hover:text-white/70'}`}>
                    {folder.category} {folder.category === 'Drills Originals' && '★'}
                  </div>
               </div>
             )
         })}
         {filteredFolders.length === 0 && (
             <div className="text-white/30 text-sm mt-10">No games found...</div>
         )}
      </div>

      {/* Right side popup for embedded cover (like an album sleeve) */}
      {activeFolderData && (
        <div 
           className="fixed right-10 top-1/2 -translate-y-1/2 w-[340px] pointer-events-auto z-20 perspective-[1000px] animate-in slide-in-from-right fade-in duration-700 ease-out fill-mode-both"
           key={activeFolderData.originalIndex}
        >
            <div className="relative w-full aspect-square bg-[#111] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col items-center justify-center transform transition-transform duration-700 hover:scale-[1.02] hover:rotateY(-5deg)" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-15deg)' }}>
               
               {/* Ambient hue */}
               <div className={`absolute inset-0 rounded-lg opacity-20 ${activeFolderData.category === 'Drills Originals' ? 'bg-[#ffe36d]' : 'bg-[#7DF9FF]'}`} />
               
               <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                  <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">Album Cover</span>
                  {activeFolderData.category === 'Drills Originals' && (
                      <span className="text-[10px] font-bold text-[#ffe36d] border border-[#ffe36d]/50 px-2 rounded-full drop-shadow-md">ORIGINAL</span>
                  )}
               </div>

               <Icon name={activeFolderData.icon} className="w-32 h-32 text-white/40 drop-shadow-2xl z-10" />
               
               <div className="absolute bottom-6 left-6 right-6 z-10 p-2 backdrop-blur-md bg-black/20 rounded-lg border border-white/5 outline outline-1 outline-black/30">
                  <div className="text-[18px] leading-tight font-bold font-mono text-white line-clamp-2 drop-shadow-lg mb-1">{activeFolderData.title}</div>
                  <div className="text-[10px] text-white/60 font-mono drop-shadow-md uppercase tracking-wider">{activeFolderData.category}</div>
               </div>

               {/* Vinyl Record decorative edge sticking out slightly */}
               <div className="absolute right-[-25px] top-[10%] bottom-[10%] w-[50px] bg-[#0a0a0a] rounded-r-full shadow-inner border-y border-r border-[#333] -z-10 flex items-center justify-end pr-2 overflow-hidden">
                  <div className="absolute inset-0 rounded-r-full mix-blend-overlay opacity-10" style={{ background: 'conic-gradient(from 45deg, red, yellow, lime, aqua, blue, magenta, red)' }} />
               </div>
            </div>

            <button 
               className="w-full mt-8 py-4 rounded-xl font-bold font-mono uppercase tracking-widest bg-[#7DF9FF] text-black shadow-[0_0_20px_rgba(125,249,255,0.4)] hover:bg-white hover:scale-[1.02] transition-all duration-300"
               onClick={() => window.open(activeFolderData.gameUrl, '_blank')}
            >
                Play Game
            </button>
        </div>
      )}

      {/* Now Playing Bar with more details */}
      {activeFolderData && (
        <div className="fixed bottom-8 left-10 right-[380px] flex items-center gap-5 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-xl z-20 shadow-2xl pointer-events-auto">
           {/* Cover Thumbnail */}
           <div className={`w-14 h-14 rounded-lg shrink-0 flex items-center justify-center border border-white/20 shadow-inner ${activeFolderData.color}`}>
              <Icon name={activeFolderData.icon} className="w-7 h-7 text-white/80" />
           </div>
           
           {/* Info */}
           <div className="flex-1 min-w-0 flex flex-col justify-center px-2">
              <div className="text-[16px] md:text-[18px] font-bold text-white truncate tracking-[0.02em] flex items-center drop-shadow-md">
                 {activeFolderData.title}
              </div>
              <div className="text-[12px] md:text-[13px] text-white/70 mt-1 tracking-wide line-clamp-2 leading-relaxed max-w-3xl font-sans drop-shadow-md">
                 <span className="font-semibold text-[#7DF9FF] mr-2">[{activeFolderData.category}]</span> 
                 {activeFolderData.description}
              </div>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-4 shrink-0">
              <button 
                className="text-white/60 hover:text-white transition-colors p-3 hover:scale-110" 
                onClick={() => {
                   if (activeRenderIndex > 0) handleFolderClick(filteredFolders[activeRenderIndex - 1].originalIndex);
                }}
              >◀◀</button>
              
              <button 
                className="text-black bg-white hover:bg-[#7DF9FF] hover:scale-105 transition-all w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                onClick={() => window.open(activeFolderData.gameUrl, '_blank')}
              >
                 ▶
              </button>

              <button 
                className="text-white/60 hover:text-white transition-colors p-3 hover:scale-110" 
                onClick={() => {
                   if (activeRenderIndex < filteredFolders.length - 1) handleFolderClick(filteredFolders[activeRenderIndex + 1].originalIndex);
                }}
              >▶▶</button>
           </div>
           
           {/* Progress Line */}
           <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 rounded-b-2xl overflow-hidden">
              <div className="h-full bg-[#7DF9FF] w-[35%] shadow-[0_0_10px_#7DF9FF] opacity-80 mix-blend-screen"></div>
           </div>
        </div>
      )}
    </div>
  );
}
