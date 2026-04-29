import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { FOLDER_DATA } from '../data/folders';
import { ExternalLink, ArrowLeft, Gamepad2, Star } from 'lucide-react';

interface DrillsShowcaseProps {
  onBack: () => void;
}

const DrillsShowcase: React.FC<DrillsShowcaseProps> = ({ onBack }) => {
  const drillsOriginals = FOLDER_DATA.filter(f => f.category === 'Drills Originals');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-transparent p-6 md:p-12 relative z-50 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-16 gap-4">
          <div className="flex items-center gap-4 md:gap-8 w-full justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)] ring-1 ring-red-400/50">
                <Star className="text-[#ffe36d] fill-[#ffe36d]" size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight">
                  DRILLS <span className="text-[#ffe36d] drop-shadow-[0_0_10px_rgba(255,227,109,0.3)]">ORIGINALS</span>
                </h1>
                <p className="hidden md:block text-white/50 font-medium max-w-lg mt-2 font-sans">
                  Khám phá kho tàng trò chơi học thuật độc quyền.
                </p>
              </div>
            </div>

            <button 
              onClick={onBack}
              className="mr-14 sm:mr-20 min-[1350px]:mr-0 group flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl md:rounded-2xl text-white font-bold transition-all shadow-lg whitespace-nowrap"
            >
              <ArrowLeft size={18} className="hidden md:block group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm md:text-base">Box Explorer</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {drillsOriginals.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col group"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <h3 className="text-2xl font-bold text-white group-hover:text-[#ffe36d] transition-colors leading-none">
                      {game.content.title}
                    </h3>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed max-w-md mt-2 ml-4">
                    {game.content.description}
                  </p>
                </div>
                <a
                  href={game.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-600 text-white transition-all shadow-xl hover:shadow-red-600/40"
                  title="Mở trong tab mới"
                >
                  <ExternalLink size={20} />
                </a>
              </div>

              <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl group-hover:border-red-500/50 transition-all duration-500">
                <iframe
                  src={game.gameUrl}
                  className="w-full h-full border-0"
                  title={game.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay for interactivity hint */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                  <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 rounded-xl border border-red-400/40 flex items-center gap-3 shadow-2xl">
                    <Gamepad2 size={18} className="text-[#ffe36d]" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Experience Now</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="mt-40 mb-16 text-center">
            <div className="inline-block h-px bg-gradient-to-r from-transparent via-red-500 to-transparent w-full max-w-2xl mb-12 opacity-30"></div>
            <p className="text-white/30 text-sm font-medium tracking-wide">
              Chơi để học • Học để chinh phục • Chào mừng bạn đến với <span className="text-red-500 font-bold">IELTS Drills Originals</span>
            </p>
        </footer>
      </div>
    </div>
  );
};

export default DrillsShowcase;

