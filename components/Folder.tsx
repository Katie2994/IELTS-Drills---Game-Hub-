import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { FolderData } from '../types';
import { isHoverableDevice } from '../utils/device';
import FolderItem from './FolderItem';
import Icon from './Icon';

interface FolderProps {
  data: FolderData;
  renderIndex: number;
  activeIndex: number | null;
  activeRenderIndex: number;
  totalRendered: number;
  onClick: (index: number) => void;
  onHover: () => void;
  isLoaded: boolean;
  shuffleOffset?: { x: number; y: number };
}

const Folder: React.FC<FolderProps> = ({ data, renderIndex, activeIndex, activeRenderIndex, totalRendered, onClick, onHover, isLoaded, shuffleOffset }) => {
  const isActive = activeIndex === data.originalIndex;
  const zIndex = isActive ? 100 : totalRendered - renderIndex;
  const [isInteracting, setIsInteracting] = useState(false);

  const calculateTransform = () => {
    let baseTranslateZ = 80 - renderIndex * 16;
    let translateY = 0;
    let translateX = 0;

    if (activeIndex !== null) {
      if (isActive) {
        translateY = -60;
        baseTranslateZ += 15;
      } else {
        if (activeRenderIndex !== -1 && renderIndex > activeRenderIndex) {
          // FIX: Corrected typo from `activeRenderindex` to `activeRenderIndex`.
          const distance = renderIndex - activeRenderIndex;
          const pushBack = Math.max(0, 40 - distance * 10);
          baseTranslateZ -= pushBack;
        }
        if (shuffleOffset) {
            translateX = shuffleOffset.x;
            translateY += shuffleOffset.y;
        }
      }
    }

    // Initial load animation offset
    const loadOffsetY = isLoaded ? 0 : 40;

    return `translateX(${translateX}px) translateY(${translateY + loadOffsetY}px) translateZ(${baseTranslateZ}px)`;
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(data.originalIndex);
    }
  };

  const handleInteractionStart = () => {
    if (!isActive) {
      setIsInteracting(true);
      onHover();
    }
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
  };

  const interactionProps = {
    onTouchStart: handleInteractionStart,
    onTouchEnd: handleInteractionEnd,
    ...(isHoverableDevice && {
        onMouseEnter: handleInteractionStart,
        onMouseLeave: handleInteractionEnd,
    }),
  };

  const waveDelay = 150 + Math.sin(renderIndex / 2.5) * 150 + renderIndex * 40;

  return (
    <div
      onClick={() => onClick(data.originalIndex)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isActive}
      aria-label={`${data.title} folder`}
      {...interactionProps}
      className="absolute cursor-pointer transition-all duration-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/70 rounded-lg"
      style={{
        transform: calculateTransform(),
        zIndex,
        opacity: isLoaded ? 1 : 0,
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        transitionDelay: `${waveDelay}ms`,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="relative w-48 h-[153px]">
        {[...Array(3)].map((_, i) => (
          <FolderItem key={i} index={i} isActive={isActive} />
        ))}
        <div
          className={`relative w-full h-full ${data.color} ${data.borderColor} border rounded-t-lg transition-transform duration-300 ease-out`}
          style={{ transform: isInteracting ? 'translateY(-16px)' : 'translateY(0)' }}
        >
          <div className={`
            absolute inset-0 flex items-center justify-center ${data.textColor === 'text-black' ? 'text-black/80' : 'text-white/80'}
            transition-opacity duration-500 ease-out
            ${isActive ? 'opacity-50' : 'opacity-0'}
          `} style={{transitionDelay: isActive ? '300ms' : '0ms'}}>
            <div className="w-16 h-16">
              <Icon name={data.icon} />
            </div>
          </div>
        </div>
        <div
          className={`absolute -top-px w-24 h-5 ${data.color} ${data.borderColor} border rounded-t-md transition-transform duration-300 ease-out flex items-center justify-center group`}
          style={{ 
            left: `${data.tabOffset}px`,
            transform: isInteracting ? 'translateY(-16px)' : 'translateY(0)'
          }}
        >
          <span className={`${data.textColor || 'text-white/90'} text-[9px] font-bold tracking-wider truncate px-1`}>{data.title}</span>
          
          {/* External Link Quick Button */}
          <div 
            className={`absolute -top-8 left-1/2 -translate-x-1/2 p-1.5 rounded-full ${data.textColor === 'text-black' ? 'bg-black/10 hover:bg-black/20 border-black/30' : 'bg-white/20 hover:bg-white/40 border-white/30'} backdrop-blur-md transition-all duration-300 ${isInteracting || isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            onClick={(e) => {
              e.stopPropagation();
              window.open(data.gameUrl, '_blank');
            }}
            title="Open game in new tab"
          >
            <ExternalLink size={12} className={data.textColor === 'text-black' ? 'text-black' : 'text-white'} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Folder;