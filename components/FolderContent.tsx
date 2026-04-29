import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FolderContentProps {
  data: { 
    title: string; 
    description: string; 
    gameUrl: string;
    thumbnailUrl?: string;
  } | null;
  isActive: boolean;
  borderColor: string;
}

const FolderContent: React.FC<FolderContentProps> = ({ data, isActive, borderColor }) => {
  const [content, setContent] = useState(data);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBorderColor, setCurrentBorderColor] = useState(borderColor);

  useEffect(() => {
    if (data) {
      setContent(data);
      setCurrentBorderColor(borderColor);
      setIsLoading(true);
    }
  }, [data, borderColor]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isActive) {
      setContent(null);
    }
  };

  return (
    <div
      role="region"
      aria-label={content ? `Game preview for ${content.title}` : undefined}
      aria-hidden={!isActive}
      onTransitionEnd={handleTransitionEnd}
      className={`
        relative 
        w-[95vw] md:w-[800px] lg:w-[1000px] 
        rounded-3xl shadow-2xl overflow-hidden
        bg-black/40 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        z-[100]
        ${isActive
          ? `opacity-100 translate-y-0 scale-100 h-auto border mt-12 mb-8 ${currentBorderColor}`
          : 'opacity-0 translate-y-10 scale-95 h-0 pointer-events-none mt-0 mb-0 border-transparent transition-none'
        }
      `}
      style={{
        maxHeight: 'none'
      }}
    >
      {content && (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 flex items-start justify-between border-b border-white/10 bg-white/5">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white tracking-tight leading-tight"
                style={{ fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              >
                {content.title}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/60 text-sm mt-1 max-w-md"
              >
                {content.description}
              </motion.p>
            </div>
            <div className="flex gap-2">
              <a 
                href={content.gameUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors backdrop-blur-md border border-white/10"
              >
                <Play size={16} className="fill-current" />
                <span>Mở Toàn Màn Hình</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Game Frame Container */}
          <div className="relative flex-1 min-h-[800px] w-full bg-black/60 group overflow-hidden">
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900"
                >
                  <Loader2 className="w-10 h-10 text-white/50 animate-spin mb-4" />
                  <span className="text-white/40 text-xs font-mono uppercase tracking-widest italic">Initializing Preview...</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {content.thumbnailUrl || content.gameUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || content.gameUrl.includes('format=jpg') ? (
              <a href={content.gameUrl} target="_blank" rel="noreferrer noopener" className="w-full h-full block relative group/thumb">
                <img
                  src={content.thumbnailUrl || content.gameUrl}
                  alt={content.title}
                  className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsLoading(false)}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 text-white border border-white/30 cursor-pointer">
                    <Play size={20} className="fill-current" />
                    <span className="font-bold tracking-wide">Nhấn vào đây để chơi game ngay</span>
                  </div>
                </div>
              </a>
            ) : (
              <iframe
                src={content.gameUrl}
                className={`w-full h-full border-0 transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                title={content.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Overlays/Decorations */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none flex items-center gap-2">
               <div className="px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-[10px] text-white/50 font-mono uppercase tracking-wider">
                 {content.thumbnailUrl || content.gameUrl.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) || content.gameUrl.includes('format=jpg') ? 'Static Preview' : 'Interactive Preview'}
               </div>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="px-5 py-3 bg-white/5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/30 uppercase tracking-tighter">
             <div>Source: {new URL(content.gameUrl).hostname}</div>
             <div className="flex items-center gap-4">
                <span>Interactive • Ready</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderContent;
