import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, Box, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { FOLDER_DATA } from '../data/folders';
import { getPosterDataUrl } from '../utils/posterArt';
import { ScreenRect } from './GalleryRoom';

export type FrameOption = 'Unframed' | 'Classic Frame' | 'Dark Studio';
export type ViewModeOption = 'Poster View' | 'Live Preview';
export type PaceOption = 'Casual' | 'Standard' | 'Timed';

interface GameDetailPageProps {
  gameIndex: number | null;
  isOpen: boolean;
  flyerRect: ScreenRect | null;
  isBookmarked: boolean;
  onToggleBookmark: (gameIndex: number) => void;
  onAddToQueue: (gameIndex: number, frame: FrameOption, pace: PaceOption) => void;
  onSelectGame: (gameIndex: number, rect: ScreenRect) => void;
  onClose: () => void;
}

const VIEW_MODES: ViewModeOption[] = ['Poster View', 'Live Preview'];
const PACES: PaceOption[] = ['Casual', 'Standard', 'Timed'];
const FRAMES: Array<{ label: FrameOption; ringClass: string }> = [
  { label: 'Unframed', ringClass: '' },
  { label: 'Classic Frame', ringClass: '4px solid #C99A63' },
  { label: 'Dark Studio', ringClass: '5px solid #1d1b24' },
];

const ACCORDIONS = [
  {
    title: 'Game Overview & Format',
    body: 'Each title in the IELTS Drills Game Hub runs directly in your browser with zero installation. Switch between Poster View and Live Preview above to inspect the game directly inside the gallery frame or launch it in a dedicated window.',
  },
  {
    title: 'Controls & Accessibility',
    body: 'Supports desktop keyboard/mouse as well as touch gestures on phones and tablets. Audio effects and background ambiance can be toggled anytime from the top bar.',
  },
  {
    title: 'Curated Notes',
    body: 'Selected for interactive vocabulary building, spatial logic, escape-room teamwork, and creative play. Save favourites to your Play Queue to keep a session playlist ready.',
  },
];

const GameDetailPage: React.FC<GameDetailPageProps> = ({
  gameIndex,
  isOpen,
  flyerRect,
  isBookmarked,
  onToggleBookmark,
  onAddToQueue,
  onSelectGame,
  onClose,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const posterBoxRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<ViewModeOption>('Poster View');
  const [pace, setPace] = useState<PaceOption>('Standard');
  const [frame, setFrame] = useState<FrameOption>('Classic Frame');
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [flyerActive, setFlyerActive] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const game = gameIndex !== null ? FOLDER_DATA[gameIndex] : null;
  const posterUrl = gameIndex !== null ? getPosterDataUrl(gameIndex) : '';

  useEffect(() => {
    if (!isOpen || gameIndex === null) {
      setDetailsVisible(false);
      setFlyerActive(false);
      return;
    }

    setViewMode('Poster View');
    if (sectionRef.current) {
      sectionRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !flyerRect || !posterBoxRef.current) {
      setFlyerActive(false);
      setDetailsVisible(true);
      return;
    }

    setDetailsVisible(false);
    setFlyerActive(true);

    let anim: Animation | null = null;
    let flyerEl: HTMLDivElement | null = null;

    const raf = requestAnimationFrame(() => {
      const targetEl = posterBoxRef.current;
      if (!targetEl) {
        setFlyerActive(false);
        setDetailsVisible(true);
        return;
      }

      const targetRect = targetEl.getBoundingClientRect();
      flyerEl = document.createElement('div');
      flyerEl.style.position = 'fixed';
      flyerEl.style.left = `${flyerRect.left}px`;
      flyerEl.style.top = `${flyerRect.top}px`;
      flyerEl.style.width = `${flyerRect.width}px`;
      flyerEl.style.height = `${flyerRect.height}px`;
      flyerEl.style.backgroundImage = `url(${getPosterDataUrl(gameIndex)})`;
      flyerEl.style.backgroundSize = 'cover';
      flyerEl.style.backgroundPosition = 'center';
      flyerEl.style.zIndex = '35';
      flyerEl.style.pointerEvents = 'none';
      flyerEl.style.transformOrigin = 'top left';
      flyerEl.style.boxShadow = '0 8px 28px rgba(58,53,80,0.16)';
      document.body.appendChild(flyerEl);

      const dx = targetRect.left - flyerRect.left;
      const dy = targetRect.top - flyerRect.top;
      const sx = targetRect.width / Math.max(1, flyerRect.width);
      const sy = targetRect.height / Math.max(1, flyerRect.height);

      anim = flyerEl.animate(
        [
          { transform: 'translate(0px, 0px) scale(1, 1)' },
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        ],
        {
          duration: 300,
          easing: 'cubic-bezier(0.25, 0.75, 0.25, 1)',
          fill: 'forwards',
        }
      );

      anim.onfinish = () => {
        setFlyerActive(false);
        if (flyerEl && flyerEl.parentNode) {
          flyerEl.parentNode.removeChild(flyerEl);
        }
      };
    });

    const detailsTimer = window.setTimeout(() => {
      setDetailsVisible(true);
    }, 1000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(detailsTimer);
      anim?.cancel();
      if (flyerEl && flyerEl.parentNode) {
        flyerEl.parentNode.removeChild(flyerEl);
      }
    };
  }, [isOpen, gameIndex, flyerRect]);

  const relatedIndices =
    gameIndex !== null
      ? [0, 1, 2, 3].map((offset) => (gameIndex + offset) % FOLDER_DATA.length)
      : [];

  const frameClass =
    frame === 'Classic Frame'
      ? 'frame-oak'
      : frame === 'Dark Studio'
        ? 'frame-dark'
        : '';

  const handleOpenRelated = (relIdx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const imgBox = e.currentTarget.querySelector('.print-card-img');
    const r = (imgBox || e.currentTarget).getBoundingClientRect();
    onSelectGame(relIdx, {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    });
  };

  return (
    <>
    <section
      id="page"
      ref={sectionRef}
      className={isOpen ? 'open' : ''}
      aria-hidden={!isOpen}
    >
      {game && gameIndex !== null && (
        <>
          <div className="page-wrapper">
            {/* Left sticky showcase column */}
            <div className="page-left">
              <div
                ref={posterBoxRef}
                className={`page-poster-box ${frameClass}`}
                style={{
                  opacity: flyerActive ? 0 : 1,
                  transition: 'opacity 0.15s ease, box-shadow 0.25s ease',
                }}
              >
                {viewMode === 'Poster View' ? (
                  <img
                    src={posterUrl}
                    alt={game.content.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <iframe
                    src={game.gameUrl}
                    title={game.content.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 0,
                      display: 'block',
                      background: '#FFF9EC',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <div
                className="page-meta-row"
                style={{
                  opacity: detailsVisible ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                }}
              >
                <span>
                  #{String(gameIndex + 1).padStart(2, '0')} / {FOLDER_DATA.length}
                </span>

                <button
                  type="button"
                  className="page-meta-btn"
                  onClick={() =>
                    setViewMode((prev) =>
                      prev === 'Poster View' ? 'Live Preview' : 'Poster View'
                    )
                  }
                >
                  {viewMode === 'Poster View' ? (
                    <>
                      <Box size={18} strokeWidth={1.6} />
                      <span>Preview live</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={18} strokeWidth={1.6} />
                      <span>View poster</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="page-meta-btn"
                  onClick={() => onToggleBookmark(gameIndex)}
                  aria-label="Bookmark game"
                >
                  <Bookmark
                    size={18}
                    strokeWidth={1.6}
                    fill={isBookmarked ? 'currentColor' : 'none'}
                  />
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Right details column */}
            <div
              className="page-right"
              style={{
                opacity: detailsVisible ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <button
                  type="button"
                  className="page-back-btn"
                  onClick={onClose}
                >
                  ← Back to gallery
                </button>
              </div>

              <h2 className="page-title">{game.content.title}</h2>
              <div className="page-artist">
                {game.category}
                {game.category === 'Drills Originals' ? ' — Curated Original' : ''}
              </div>
              <p className="page-desc">{game.content.description}</p>
              <div className="page-price">
                {game.category === 'Drills Originals' ? 'Drills Original' : 'Featured Release'} · Free Access
              </div>
              <div className="page-tax">
                Runs directly in browser. Desktop and touch devices supported.
              </div>

              {/* Four Option Groups */}
              <div className="option-groups">
                <div>
                  <div className="option-label">
                    Showcase Mode <span>{viewMode}</span>
                  </div>
                  <div className="chip-row">
                    {VIEW_MODES.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setViewMode(m)}
                        className={`chip-btn ${viewMode === m ? 'selected' : ''}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="option-label">
                    Session Pace <span>{pace}</span>
                  </div>
                  <div className="chip-row">
                    {PACES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPace(p)}
                        className={`chip-btn ${pace === p ? 'selected' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="option-label">
                    Frame Finish <span>{frame}</span>
                  </div>
                  <div className="chip-row">
                    {FRAMES.map((f) => (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => setFrame(f.label)}
                        className={`frame-chip-btn ${frame === f.label ? 'selected' : ''}`}
                      >
                        <div
                          style={{
                            width: 'calc(38 * var(--w))',
                            minWidth: '30px',
                            aspectRatio: '3 / 4',
                            backgroundImage: `url(${posterUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: f.ringClass || '1px solid var(--ink-15)',
                            backgroundColor: '#F6EAD8',
                          }}
                        />
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div className="buy-row">
                <a
                  href={game.gameUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-cta"
                  style={{ gap: '8px' }}
                >
                  <span>PLAY GAME</span>
                  <ExternalLink size={16} strokeWidth={1.8} />
                </a>
                <button
                  type="button"
                  onClick={() => onAddToQueue(gameIndex, frame, pace)}
                  className="secondary-cta"
                >
                  ADD TO QUEUE
                </button>
              </div>

              {/* Accordions */}
              <div className="accordion-group">
                {ACCORDIONS.map((item, idx) => {
                  const isRowOpen = openAccordion === idx;
                  return (
                    <div key={item.title} className="accordion-row">
                      <button
                        type="button"
                        className="accordion-trigger"
                        onClick={() => setOpenAccordion(isRowOpen ? null : idx)}
                        aria-expanded={isRowOpen}
                      >
                        <span>{item.title}</span>
                        <span className={`accordion-plus ${isRowOpen ? 'open' : ''}`}>
                          +
                        </span>
                      </button>
                      <div className={`accordion-panel ${isRowOpen ? 'open' : ''}`}>
                        <div className="accordion-inner">
                          <div className="accordion-body">{item.body}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Collection Band */}
          <div
            className="collection-band"
            style={{
              opacity: detailsVisible ? 1 : 0,
              transition: 'opacity 0.15s ease',
            }}
          >
            <h3 className="collection-heading">GET THE COLLECTION</h3>
            <div className="collection-row">
              {relatedIndices.map((relIdx) => {
                const rel = FOLDER_DATA[relIdx];
                return (
                  <button
                    key={relIdx}
                    type="button"
                    className="print-card"
                    onClick={(e) => handleOpenRelated(relIdx, e)}
                  >
                    <div className="print-card-img">
                      <img
                        src={getPosterDataUrl(relIdx)}
                        alt={rel.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                    <div className="print-card-title">{rel.title}</div>
                    <div className="print-card-artist">{rel.category}</div>
                    <div className="print-card-meta">
                      #{String(relIdx + 1).padStart(2, '0')} · FREE
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>

    {/* Fixed Mobile Bottom Action Dock — always visible at bottom of screen */}
    {isOpen && game && gameIndex !== null && (
      <div className="mobile-detail-dock">
        <a
          href={game.gameUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-cta"
          style={{ gap: '8px' }}
        >
          <span>PLAY GAME</span>
          <ExternalLink size={17} strokeWidth={1.8} />
        </a>
        <button
          type="button"
          onClick={() => onAddToQueue(gameIndex, frame, pace)}
          className="secondary-cta"
        >
          + QUEUE
        </button>
      </div>
    )}
    </>
  );
};

export default GameDetailPage;
