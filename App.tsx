import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Heart,
  Layers,
  Search,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { FOLDER_DATA } from './data/folders';
import { galleryAudio } from './utils/galleryAudio';
import GalleryRoom, { GalleryRoomHandle, ScreenRect } from './components/GalleryRoom';
import GameDetailPage, { FrameOption, PaceOption } from './components/GameDetailPage';
import GameListView from './components/GameListView';
import QueueDrawer, { QueueItem } from './components/QueueDrawer';
import SearchModal from './components/SearchModal';

type ActiveView = 'gallery' | 'list' | 'detail';

export default function App() {
  const galleryRef = useRef<GalleryRoomHandle>(null);

  const [isReady, setIsReady] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);

  const [view, setView] = useState<ActiveView>('gallery');
  const [listCategory, setListCategory] = useState<string>('All');

  const [isFocused, setIsFocused] = useState(false);
  const [focusedGameIndex, setFocusedGameIndex] = useState<number | null>(null);
  const [lastGameIndex, setLastGameIndex] = useState<number>(0);

  const [detailGameIndex, setDetailGameIndex] = useState<number | null>(null);
  const [flyerRect, setFlyerRect] = useState<ScreenRect | null>(null);

  const [hoverPill, setHoverPill] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [isBgmPlaying, setIsBgmPlaying] = useState(false);

  useEffect(() => {
    const syncViewportVars = () => {
      const vv = window.visualViewport;
      const appTop = vv ? Math.max(0, Math.round(vv.offsetTop)) : 0;
      const appHeight = vv ? Math.round(vv.height) : window.innerHeight;
      const obscuredBottom = vv
        ? Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)))
        : 0;
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--app-top', `${appTop}px`);
      rootStyle.setProperty('--app-height', `${appHeight}px`);
      rootStyle.setProperty('--vv-bottom', `${obscuredBottom}px`);
    };

    syncViewportVars();
    window.addEventListener('resize', syncViewportVars);
    window.addEventListener('orientationchange', syncViewportVars);
    window.visualViewport?.addEventListener('resize', syncViewportVars);
    window.visualViewport?.addEventListener('scroll', syncViewportVars);

    const unlock = () => {
      const started = galleryAudio.unlockAndAutoStart();
      if (started) {
        setIsBgmPlaying(true);
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('resize', syncViewportVars);
      window.removeEventListener('orientationchange', syncViewportVars);
      window.visualViewport?.removeEventListener('resize', syncViewportVars);
      window.visualViewport?.removeEventListener('scroll', syncViewportVars);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      galleryAudio.stopBgm(false);
    };
  }, []);

  const toggleBgm = () => {
    const playing = galleryAudio.toggleBgm();
    setIsBgmPlaying(playing);
  };

  const handleRoomReady = useCallback(() => {
    setIsReady(true);
    window.setTimeout(() => {
      setIntroPlayed(true);
    }, 1500);
  }, []);

  const handleFocusChange = useCallback((focused: boolean, gameIndex: number | null) => {
    setIsFocused(focused);
    setFocusedGameIndex(gameIndex);
    if (gameIndex !== null) {
      setLastGameIndex(gameIndex);
    }
  }, []);

  const handleHoverPill = useCallback((visible: boolean, x: number, y: number) => {
    setHoverPill({ visible, x, y });
  }, []);

  const openGameDetail = useCallback(
    (gameIndex: number, rect: ScreenRect) => {
      galleryAudio.playOpen();
      setLastGameIndex(gameIndex);
      setFlyerRect(rect);
      setDetailGameIndex(gameIndex);
      setHoverPill({ visible: false, x: 0, y: 0 });
      setView('detail');
    },
    []
  );

  const returnToRoom = useCallback(
    (focusLast = true) => {
      if (view === 'gallery') {
        if (isFocused) {
          galleryRef.current?.stepBack();
        }
        return;
      }
      galleryAudio.playClose();
      setView('gallery');
      setHoverPill({ visible: false, x: 0, y: 0 });
      if (focusLast) {
        galleryRef.current?.focusGame(lastGameIndex, false);
      }
    },
    [view, isFocused, lastGameIndex]
  );

  const openList = useCallback(
    (category = 'All') => {
      galleryAudio.playOpen();
      setListCategory(category);
      setHoverPill({ visible: false, x: 0, y: 0 });
      setView('list');
    },
    []
  );

  const handleAddToQueue = useCallback(
    (gameIndex: number, frame: FrameOption, pace: PaceOption) => {
      galleryAudio.playQueueAdd();
      setQueueItems((prev) => {
        const exists = prev.some(
          (item) =>
            item.gameIndex === gameIndex && item.frame === frame && item.pace === pace
        );
        if (exists) return prev;
        return [
          {
            id: `${gameIndex}-${frame}-${pace}-${Date.now()}`,
            gameIndex,
            frame,
            pace,
            addedAt: Date.now(),
          },
          ...prev,
        ];
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const handleRemoveQueueItem = useCallback((id: string) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleToggleBookmark = useCallback((gameIndex: number) => {
    setBookmarks((prev) =>
      prev.includes(gameIndex) ? prev.filter((i) => i !== gameIndex) : [...prev, gameIndex]
    );
  }, []);

  const handleJumpInRoom = useCallback(
    (gameIndex: number) => {
      setView('gallery');
      setLastGameIndex(gameIndex);
      galleryRef.current?.focusGame(gameIndex, false);
    },
    []
  );

  const handleHeaderBookmark = () => {
    const targetIdx =
      view === 'detail' && detailGameIndex !== null
        ? detailGameIndex
        : focusedGameIndex ?? lastGameIndex;
    handleToggleBookmark(targetIdx);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          return;
        }
        if (isHelpOpen) {
          setIsHelpOpen(false);
          return;
        }
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
          return;
        }
        if (view === 'detail') {
          returnToRoom(true);
          return;
        }
        if (view === 'list') {
          returnToRoom(true);
          return;
        }
        if (isFocused) {
          galleryRef.current?.stepBack();
        }
        return;
      }

      if (view === 'gallery' && !isSearchOpen && !isDrawerOpen && !isHelpOpen) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          galleryRef.current?.step(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          galleryRef.current?.step(-1);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, isFocused, isDrawerOpen, isSearchOpen, isHelpOpen, returnToRoom]);

  const activeNavBookmark = useMemo(() => {
    const targetIdx =
      view === 'detail' && detailGameIndex !== null
        ? detailGameIndex
        : focusedGameIndex ?? lastGameIndex;
    return bookmarks.includes(targetIdx);
  }, [view, detailGameIndex, focusedGameIndex, lastGameIndex, bookmarks]);

  const navIntroClass = introPlayed
    ? ''
    : isReady
      ? 'intro-play'
      : 'intro-pending';

  const guiIntroClass = introPlayed
    ? ''
    : isReady
      ? 'intro-play'
      : 'intro-pending';

  return (
    <>
      {/* 1. Top Navigation */}
      <header
        className={`nav ${view !== 'gallery' ? 'solid' : ''} ${navIntroClass}`}
      >
        <button
          type="button"
          className="nav-logo"
          onClick={() => returnToRoom(true)}
        >
          IELTS Drills
        </button>

        <nav className="nav-links" aria-label="Primary">
          <button
            type="button"
            className={`nav-link ${view === 'gallery' ? 'active' : ''}`}
            onClick={() => returnToRoom(true)}
          >
            Index
          </button>
          <button
            type="button"
            className={`nav-link ${view === 'list' && listCategory === 'All' ? 'active' : ''}`}
            onClick={() => openList('All')}
          >
            Games
          </button>
          <button
            type="button"
            className={`nav-link ${view === 'list' && listCategory === 'Drills Originals' ? 'active' : ''}`}
            onClick={() => openList('Drills Originals')}
          >
            Originals
          </button>
          <button
            type="button"
            className={`nav-link ${view === 'list' && listCategory === 'Phòng Thoát Hiểm' ? 'active' : ''}`}
            onClick={() => openList('Phòng Thoát Hiểm')}
          >
            Escape
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => setIsHelpOpen(true)}
          >
            Help
          </button>
        </nav>

        <div className="nav-right">
          <button
            type="button"
            className="nav-search"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search games"
          >
            <Search size={12} strokeWidth={1.6} />
            <span>Search…</span>
            <kbd className="nav-search-kbd">⌘K</kbd>
          </button>

          <button
            type="button"
            className="nav-search-mobile"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search games"
          >
            <Search size={18} strokeWidth={1.7} />
          </button>

          <button
            type="button"
            className={`nav-pill-btn ${isBgmPlaying ? 'active' : ''}`}
            onClick={toggleBgm}
            aria-label="Toggle gallery soundtrack"
            title={isBgmPlaying ? 'Mute gallery soundtrack' : 'Play gallery soundtrack'}
          >
            {isBgmPlaying ? <Volume2 size={14} strokeWidth={1.7} /> : <VolumeX size={14} strokeWidth={1.7} />}
            <span>{isBgmPlaying ? 'SOUND' : 'MUTED'}</span>
          </button>

          <button
            type="button"
            className="nav-icon-btn nav-hide-sm"
            onClick={() => {
              const nextIdx = (lastGameIndex + 1) % 25;
              handleJumpInRoom(nextIdx);
            }}
            aria-label="Discover next game"
            title="Discover next game in 3D room"
          >
            <Compass size={18} strokeWidth={1.6} />
          </button>

          <button
            type="button"
            className="nav-icon-btn nav-hide-sm"
            onClick={handleHeaderBookmark}
            aria-label="Bookmark current game"
            title="Bookmark current game"
          >
            <Heart
              size={18}
              strokeWidth={1.6}
              fill={activeNavBookmark ? 'currentColor' : 'none'}
            />
          </button>

          <button
            type="button"
            className="nav-icon-btn bag-only"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open play queue"
            title="Open play queue"
          >
            <Layers size={18} strokeWidth={1.6} />
            {queueItems.length > 0 && (
              <span className="nav-badge">{queueItems.length}</span>
            )}
          </button>
        </div>
      </header>

      {/* 2. 3D Gallery Corridor + Load Veil */}
      <GalleryRoom
        ref={galleryRef}
        isActiveView={view === 'gallery' && !isDrawerOpen && !isSearchOpen && !isHelpOpen}
        onFocusChange={handleFocusChange}
        onHoverPill={handleHoverPill}
        onOpenGame={openGameDetail}
        onReady={handleRoomReady}
        onStepSound={() => galleryAudio.playStep()}
      />

      <div id="veil" className={isReady ? 'cleared' : ''} />

      {/* 3. Gallery HUD Overlay */}
      <div
        className={`gui ${view !== 'gallery' ? 'hidden-ui' : ''} ${guiIntroClass}`}
        aria-hidden={view !== 'gallery'}
      >
        {/* Left Navigation Arrows */}
        <div className={`gui-arrows ${isFocused ? 'focused-hide-sm' : ''}`}>
          <button
            type="button"
            className="gui-arrow-btn"
            onClick={() => galleryRef.current?.step(-1)}
            aria-label="Previous game"
          >
            <ArrowLeft size={22} strokeWidth={1.6} />
          </button>
          <button
            type="button"
            className="gui-arrow-btn"
            onClick={() => galleryRef.current?.step(1)}
            aria-label="Next game"
          >
            <ArrowRight size={22} strokeWidth={1.6} />
          </button>
        </div>

        {/* Right Hint */}
        <div className="gui-hint">
          <span className="mask-line">
            <span className="mask-inner mask-delay-0">
              {isFocused ? 'Click the game to open it' : 'Scroll or drag to walk round'}
            </span>
          </span>
          <span className="mask-line">
            <span className="mask-inner mask-delay-1">
              {isFocused ? 'Esc or click away to step back' : 'Click a poster to look closer'}
            </span>
          </span>
        </div>

        {/* Gallery / List Toggle */}
        <div
          className={`gui-toggle ${isFocused ? 'focused-hide-sm' : ''}`}
          role="tablist"
          aria-label="View mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === 'gallery'}
            className={`gui-toggle-btn ${view === 'gallery' ? 'active' : ''}`}
            onClick={() => returnToRoom(true)}
          >
            GALLERY
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'list'}
            className={`gui-toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => openList('All')}
          >
            LIST
          </button>
        </div>

        {/* Bottom-Left Editorial Caption */}
        <div className={`gui-caption ${isFocused ? 'focused-hide-sm' : ''}`}>
          <div className="gui-kicker">
            <span className="mask-line">
              <span className="mask-inner mask-delay-2">YOU ARE WALKING PAST</span>
            </span>
          </div>
          <div className="gui-headline-row">
            <h1 className="gui-headline">
              <span className="mask-line">
                <span className="mask-inner mask-delay-3">GAME SEASON</span>
              </span>
            </h1>
            <button
              type="button"
              className="gui-enter-link"
              onClick={() => openList('All')}
            >
              <span className="mask-line">
                <span className="mask-inner mask-delay-4">ENTER THE COLLECTION →</span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Thumb-Zone Action Card when focused on a painting */}
        {isFocused && focusedGameIndex !== null && FOLDER_DATA[focusedGameIndex] && (
          <div className="mobile-focus-bar">
            <div className="mobile-focus-meta">
              <span className="mobile-focus-cat">
                {FOLDER_DATA[focusedGameIndex].category} · #{String(focusedGameIndex + 1).padStart(2, '0')}
              </span>
              <span className="mobile-focus-title">
                {FOLDER_DATA[focusedGameIndex].content.title}
              </span>
            </div>
            <div className="mobile-focus-actions">
              <button
                type="button"
                className="mobile-focus-open"
                onClick={() => {
                  const w = window.innerWidth;
                  const h = window.innerHeight;
                  openGameDetail(focusedGameIndex, {
                    left: w * 0.25,
                    top: h * 0.2,
                    width: w * 0.5,
                    height: h * 0.45,
                  });
                }}
              >
                OPEN GAME →
              </button>
              <button
                type="button"
                className="mobile-focus-back"
                onClick={() => galleryRef.current?.stepBack()}
              >
                BACK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Floating Hover Pill */}
      <div
        className={`hover-pill ${view === 'gallery' && hoverPill.visible ? 'visible' : ''}`}
        style={{
          left: `${hoverPill.x}px`,
          top: `${hoverPill.y}px`,
        }}
      >
        OPEN THE GAME
      </div>

      {/* 5. Game Detail Page */}
      <GameDetailPage
        gameIndex={detailGameIndex}
        isOpen={view === 'detail'}
        flyerRect={flyerRect}
        isBookmarked={detailGameIndex !== null && bookmarks.includes(detailGameIndex)}
        onToggleBookmark={handleToggleBookmark}
        onAddToQueue={handleAddToQueue}
        onSelectGame={openGameDetail}
        onClose={() => returnToRoom(true)}
      />

      {/* 6. List / Catalog Page */}
      <GameListView
        isOpen={view === 'list'}
        activeCategory={listCategory}
        onCategoryChange={setListCategory}
        onSelectGame={openGameDetail}
      />

      {/* 7. Play Queue Drawer */}
      <QueueDrawer
        isOpen={isDrawerOpen}
        items={queueItems}
        onClose={() => setIsDrawerOpen(false)}
        onRemoveItem={handleRemoveQueueItem}
        onOpenGame={(idx) => {
          setFlyerRect(null);
          setDetailGameIndex(idx);
          setLastGameIndex(idx);
          setView('detail');
        }}
      />

      {/* 8. Search Modal (⌘K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onJumpToInRoom={handleJumpInRoom}
        onOpenDetail={(idx) => {
          setFlyerRect(null);
          setDetailGameIndex(idx);
          setLastGameIndex(idx);
          setView('detail');
        }}
      />

      {/* 9. Help / Navigation Guide Modal */}
      {isHelpOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(58, 53, 80, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--page)',
              border: '1px solid var(--ink-35)',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(58, 53, 80, 0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-cond)',
                  fontWeight: 600,
                  fontSize: '28px',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                GALLERY GUIDE
              </h2>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                aria-label="Close help"
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} strokeWidth={1.6} />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontFamily: 'var(--font-serif)',
                fontSize: '15px',
                lineHeight: 1.55,
                color: 'var(--ink-60)',
              }}
            >
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--ink)' }}>Walk the Corridor:</strong>{' '}
                Scroll, drag horizontally or vertically, or use the circular arrows and keyboard arrow keys to glide through the circular gallery.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--ink)' }}>Inspect &amp; Play:</strong>{' '}
                Click any framed poster on either wall to focus on it. Click it again to open the game detail page, switch to Live Preview, or launch the game.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: 'var(--ink)' }}>Quick Search:</strong>{' '}
                Press ⌘K (or Ctrl+K) anytime to search all 25 games and jump directly to a title.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
