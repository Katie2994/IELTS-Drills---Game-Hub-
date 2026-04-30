import React, { useMemo, useState, useEffect } from 'react';
import { FolderData } from '../types';
import { isHoverableDevice } from '../utils/device';
import Folder from './Folder';

interface FolderBoxProps {
    folders: FolderData[];
    activeIndex: number | null;
    onFolderClick: (index: number) => void;
    onFolderHover: () => void;
    isLoaded: boolean;
}

const FolderBox: React.FC<FolderBoxProps> = ({ folders, activeIndex, onFolderClick, onFolderHover, isLoaded }) => {
  const BOX_WIDTH = 200;
  const BOX_HEIGHT = 130;
  const BOX_DEPTH = 200;
  
  const [shuffleOffsets, setShuffleOffsets] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    const newOffsets = folders.map(() => {
        if (activeIndex !== null) {
            return {
                x: Math.random() * 8 - 4, // -4 to 4
                y: Math.random() * 8 - 4, // -4 to 4
            };
        }
        return { x: 0, y: 0 };
    });
    setShuffleOffsets(newOffsets);
  }, [activeIndex, folders.length]);

  const activeRenderIndex = useMemo(() => {
    if (activeIndex === null) return -1;
    return folders.findIndex(f => f.originalIndex === activeIndex);
  }, [activeIndex, folders]);

  const handleBoxInteractionStart = (e: React.SyntheticEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'rotateX(-30deg) rotateY(50deg) scale3d(1.05, 1.05, 1.05)';
  };

  const handleBoxInteractionEnd = (e: React.SyntheticEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'rotateX(-25deg) rotateY(35deg)';
  };

  const interactionProps = {
    onTouchStart: handleBoxInteractionStart,
    onTouchEnd: handleBoxInteractionEnd,
    ...(isHoverableDevice && {
        onMouseEnter: handleBoxInteractionStart,
        onMouseLeave: handleBoxInteractionEnd,
    }),
  };

  return (
    <div className="relative w-[207px] h-[150px]">
      <div
        className="absolute w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className="absolute"
          style={{
            width: `${BOX_WIDTH}px`,
            height: `${BOX_HEIGHT}px`,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(-25deg) rotateY(35deg)',
            transition: 'transform 0.6s ease-out',
          }}
          {...interactionProps}
        >
          {/* Panels */}
          <div className="absolute bg-[#EAE0D6]/30 backdrop-blur-sm border border-white/20 shadow-[0_0_5px_rgba(0,0,0,0.2)]" style={{ width: `${BOX_WIDTH}px`, height: `${BOX_HEIGHT}px`, transform: `translateZ(${BOX_DEPTH / 2}px)` }}>
            <div className="absolute top-[10px] left-1/2 bg-[#333]/70 rounded-[6px]" style={{ width: '50px', height: '12px', transform: 'translateX(-50%)' }}/>
          </div>
          <div className="absolute bg-[#EAE0D6]/30 backdrop-blur-sm border border-white/20 shadow-[0_0_5px_rgba(0,0,0,0.2)]" style={{ width: `${BOX_WIDTH}px`, height: `${BOX_HEIGHT}px`, transform: `rotateY(180deg) translateZ(${BOX_DEPTH / 2}px)` }}/>
          <div className="absolute bg-[#EAE0D6]/30 backdrop-blur-sm border border-white/20 shadow-[0_0_5px_rgba(0,0,0,0.2)]" style={{ width: `${BOX_DEPTH}px`, height: `${BOX_HEIGHT}px`, transform: `rotateY(90deg) translateZ(${BOX_WIDTH / 2}px)` }}/>
          <div className="absolute bg-[#EAE0D6]/30 backdrop-blur-sm border border-white/20 shadow-[0_0_5px_rgba(0,0,0,0.2)]" style={{ width: `${BOX_DEPTH}px`, height: `${BOX_HEIGHT}px`, transform: `rotateY(-90deg) translateZ(${BOX_WIDTH / 2}px)` }}/>
          <div className="absolute bg-[#EAE0D6]/30 backdrop-blur-sm border border-white/20 shadow-[0_0_5px_rgba(0,0,0,0.2)]" style={{ width: `${BOX_WIDTH}px`, height: `${BOX_DEPTH}px`, transform: 'rotateX(-90deg) translateZ(30px)' }}/>
          
          <div className="absolute top-[-35px] left-[7.5px]" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-5px)' }}>
            {folders.map((folder, index) => {
              // Always keep tabs securely on the right edge of the folder (folder is 192px, tab is 96px -> 96px offset)
              const dynamicData = {
                ...folder,
                tabOffset: 96
              };
              
              return (
                <Folder
                  key={folder.originalIndex}
                  renderIndex={index}
                  data={dynamicData}
                  activeIndex={activeIndex}
                  activeRenderIndex={activeRenderIndex}
                  totalRendered={folders.length}
                  onClick={onFolderClick}
                  onHover={onFolderHover}
                  isLoaded={isLoaded}
                  shuffleOffset={shuffleOffsets[index]}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderBox;