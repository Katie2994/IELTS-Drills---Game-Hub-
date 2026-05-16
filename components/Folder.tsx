import React, { useRef } from 'react';
import Icon from './Icon';
import { ExternalLink } from 'lucide-react';

interface FolderData {
  title: string;
  gameUrl: string;
  description: string;
  youtubeId: string;
  category?: string;
  icon: string;
  color: string;
  borderColor: string;
  textColor: string;
}

interface FolderProps {
  key?: React.Key;
  data: FolderData;
  renderIndex: number;
  activeIndex: number | null;
  activeRenderIndex: number;
  totalRendered: number;
  onClick: (index: number) => void;
  onHover: () => void;
  isLoaded: boolean;
}

export default function Folder({ 
  data, 
  renderIndex, 
  activeIndex,
  activeRenderIndex,
  totalRendered,
  onClick, 
  onHover,
  isLoaded
}: FolderProps) {
  const isActive = renderIndex === activeRenderIndex;
  
  const calculateTransform = () => {
    const SPACING_Z = 60;
    const SPACING_Y = 35;
    const SPACING_X = 25;
    
    // relIdx > 0 means later in the list.
    const relIdx = renderIndex - activeRenderIndex;
    const distance = Math.abs(relIdx);
    
    let translateX = relIdx * SPACING_X;
    let translateY = relIdx * SPACING_Y;
    let translateZ = -Math.max(0, distance * SPACING_Z);
    let rotateZ = relIdx * 2;

    if (isActive) {
      translateZ += 60;
      translateX -= 50;
      translateY -= 20;
      rotateZ = 0;
    }

    const loadOffsetZ = isLoaded ? 0 : -200;

    return `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ + loadOffsetZ}px) rotateZ(${rotateZ}deg)`;
  };

  const transform = calculateTransform();

  // Opacity controls based on distance
  const relIdx = renderIndex - activeRenderIndex;
  const distance = Math.abs(relIdx);
  const opacity = Math.max(0.1, 1 - distance * 0.1);
  const zIndex = 100 - distance;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(renderIndex);
      }}
      onMouseEnter={() => {
        if (!isActive) onHover();
      }}
      className={`absolute left-1/2 top-1/2 -ml-[90px] -mt-[90px] cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
      style={{
        transform,
        opacity: isLoaded ? opacity : 0,
        zIndex,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="relative w-[180px] h-[180px]" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* CD Disc (Always sticking out top) */}
        <div 
          className="absolute inset-0 rounded-full shadow-lg transition-all duration-700 flex items-center justify-center pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg at 50% 50%, #dcdcdc 0%, #ffffff 10%, #dcdcdc 20%, #f0f0f0 30%, #dcdcdc 40%, #ffffff 50%, #dcdcdc 60%, #f0f0f0 70%, #dcdcdc 80%, #ffffff 90%, #dcdcdc 100%)',
            boxShadow: 'inset 0 0 5px rgba(255,255,255,0.8), 0 5px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.7)',
            transform: isActive ? 'translateY(-110px) translateX(-20px) rotate(180deg)' : 'translateY(-70px) rotate(0deg)',
            zIndex: -1
          }}
        >
          {/* CD rainbow overlay */}
          <div className="absolute inset-0 rounded-full mix-blend-overlay opacity-30 pointer-events-none" style={{ background: 'conic-gradient(from 45deg, red, yellow, lime, aqua, blue, magenta, red)' }} />
          
          {/* CD inner ring */}
          <div className="w-[50px] h-[50px] rounded-full border-[1.5px] border-gray-400/50 flex items-center justify-center shadow-[inset_0_0_8px_rgba(0,0,0,0.2)] bg-transparent">
             <div className="w-4 h-4 rounded-full bg-black/40 shadow-inner" />
          </div>
        </div>

        {/* Album Cover */}
        <div
          className={`absolute inset-0 w-full h-full ${data.color} ${data.borderColor} border-[1.5px] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out overflow-hidden`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className={`absolute inset-0 flex items-center justify-center ${data.textColor === 'text-black' ? 'text-black/80' : 'text-white/80'} bg-black/20 backdrop-blur-[2px]`}>
             <Icon name={data.icon} />
             
             {/* Glossy overlay */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 mix-blend-overlay pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}
