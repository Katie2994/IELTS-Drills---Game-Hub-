import React, { useRef, useEffect } from 'react';

const BackgroundEffects: React.FC = () => {
  const orbRef = useRef<HTMLDivElement>(null);
  // FIX: useRef was called without an initial value. It is now initialized with null.
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbRef.current) return;

      const { clientX, clientY } = e;
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      animationFrameId.current = requestAnimationFrame(() => {
        if (orbRef.current) {
          orbRef.current.style.transform = `translate(${clientX}px, ${clientY}px)`;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return <div ref={orbRef} className="background-orb" aria-hidden="true" />;
};

export default BackgroundEffects;
