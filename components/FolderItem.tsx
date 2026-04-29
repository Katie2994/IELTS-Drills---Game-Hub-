import React from 'react';

interface FolderItemProps {
  isActive: boolean;
  index: number;
}

const FolderItem: React.FC<FolderItemProps> = ({ isActive, index }) => {
  return (
    <div
      className={`
        absolute w-[88%] h-[85%] bg-slate-100/90 rounded-md shadow-lg
        transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        left-[6%] top-[10%] pointer-events-none
      `}
      style={{
        transitionDelay: `${isActive ? 100 + index * 60 : 0}ms`,
        transform: isActive
          ? `translateY(${-40 - index * 20}px) rotate(${(index - 1) * 6}deg)`
          : 'translateY(0px) rotate(0deg)',
        opacity: isActive ? 1 : 0,
        zIndex: -1,
      }}
    />
  );
};

export default FolderItem;
