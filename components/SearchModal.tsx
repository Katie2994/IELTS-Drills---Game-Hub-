import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { FOLDER_DATA } from '../data/folders';
import { getPosterDataUrl } from '../utils/posterArt';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToInRoom: (gameIndex: number) => void;
  onOpenDetail: (gameIndex: number) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onJumpToInRoom,
  onOpenDetail,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FOLDER_DATA.map((game, index) => ({ game, index })).filter(({ game }) => {
      if (!q) return true;
      return (
        game.title.toLowerCase().includes(q) ||
        game.category.toLowerCase().includes(q) ||
        game.content.description.toLowerCase().includes(q)
      );
    });
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--app-top, 0px)',
        left: 0,
        right: 0,
        height: 'var(--app-height, 100dvh)',
        zIndex: 50,
        background: 'rgba(58, 53, 80, 0.28)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'max(14px, 4vh) 12px max(16px, var(--mobile-bottom-safe, 16px))',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'var(--page)',
          border: '1.5px solid var(--ink-35)',
          boxShadow: '0 20px 60px rgba(58, 53, 80, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(var(--app-height, 100dvh) - 28px - var(--mobile-bottom-safe, 0px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderBottom: '1px solid var(--ink-15)',
          }}
        >
          <Search size={19} strokeWidth={1.7} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${FOLDER_DATA.length} games, categories, or themes…`}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              color: 'var(--ink)',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            style={{
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} strokeWidth={1.7} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '8px 0' }}>
          {matches.length === 0 ? (
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--ink-60)',
              }}
            >
              NO GAMES MATCH "{query.toUpperCase()}"
            </div>
          ) : (
            matches.map(({ game, index }) => (
              <div
                key={game.title}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ink-15)',
                }}
              >
                <img
                  src={getPosterDataUrl(index)}
                  alt={game.title}
                  style={{
                    width: '44px',
                    height: '58px',
                    objectFit: 'cover',
                    background: '#F6EAD8',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 500,
                      fontSize: '16.5px',
                    }}
                  >
                    {game.title}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--ink-60)',
                      marginTop: '2px',
                    }}
                  >
                    {game.category} · #{String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => {
                      onClose();
                      onJumpToInRoom(index);
                    }}
                  >
                    3D View
                  </button>
                  <button
                    type="button"
                    className="chip-btn selected"
                    onClick={() => {
                      onClose();
                      onOpenDetail(index);
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
