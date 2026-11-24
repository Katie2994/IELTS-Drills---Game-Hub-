import React, { useEffect, useState } from 'react';
import { ExternalLink, Trash2, X } from 'lucide-react';
import { FOLDER_DATA } from '../data/folders';
import { getPosterDataUrl } from '../utils/posterArt';
import { FrameOption, PaceOption } from './GameDetailPage';

export interface QueueItem {
  id: string;
  gameIndex: number;
  frame: FrameOption;
  pace: PaceOption;
  addedAt: number;
}

interface QueueDrawerProps {
  isOpen: boolean;
  items: QueueItem[];
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onOpenGame: (gameIndex: number) => void;
}

const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onRemoveItem,
  onOpenGame,
}) => {
  const [showRows, setShowRows] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowRows(false);
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setShowRows(true);
      return;
    }
    const timer = window.setTimeout(() => setShowRows(true), 220);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const firstGame = items[0] ? FOLDER_DATA[items[0].gameIndex] : null;

  return (
    <>
      <div
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside className={`drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '18px',
            borderBottom: '1px solid var(--ink-15)',
          }}
        >
          <h2 className="drawer-title">YOUR QUEUE</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue drawer"
            style={{
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} strokeWidth={1.7} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.12em',
                textAlign: 'center',
                marginTop: 'max(80px, calc(120 * var(--w)))',
                color: 'var(--ink-60)',
              }}
            >
              YOUR QUEUE IS EMPTY
            </div>
          ) : (
            items.map((item, idx) => {
              const game = FOLDER_DATA[item.gameIndex];
              if (!game) return null;
              return (
                <div
                  key={item.id}
                  className={showRows ? 'drawer-item-enter' : ''}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    opacity: showRows ? 1 : 0,
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGame(item.gameIndex);
                    }}
                    style={{
                      width: 'max(68px, calc(72 * var(--w)))',
                      aspectRatio: '3 / 4',
                      background: '#F6EAD8',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={getPosterDataUrl(item.gameIndex)}
                      alt={game.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGame(item.gameIndex);
                      }}
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 500,
                        fontSize: 'max(16px, calc(16 * var(--w)))',
                        textAlign: 'left',
                        display: 'block',
                      }}
                    >
                      {game.title}
                    </button>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: 'max(14px, calc(14 * var(--w)))',
                        color: 'var(--ink-60)',
                        marginTop: '3px',
                      }}
                    >
                      {game.category}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'max(12px, calc(12 * var(--w)))',
                        color: 'var(--ink-60)',
                        marginTop: '6px',
                      }}
                    >
                      {item.pace} · {item.frame}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '10px',
                      }}
                    >
                      <a
                        href={game.gameUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          borderBottom: '1.5px solid var(--ink)',
                          minHeight: '36px',
                          padding: '4px 0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>Play</span>
                        <ExternalLink size={14} strokeWidth={1.7} />
                      </a>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${game.title}`}
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--ink-60)',
                          minWidth: '40px',
                          minHeight: '40px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={18} strokeWidth={1.6} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            borderTop: '1px solid var(--ink-35)',
            paddingTop: '16px',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 'max(13px, calc(13 * var(--w)))',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <span>Queued Games</span>
            <span>{items.length}</span>
          </div>

          {firstGame ? (
            <a
              href={firstGame.gameUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-cta"
              style={{ width: '100%' }}
            >
              PLAY NEXT →
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="primary-cta"
              style={{ width: '100%' }}
            >
              BROWSE GALLERY →
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default QueueDrawer;
