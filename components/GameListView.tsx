import React, { useMemo } from 'react';
import { FOLDER_DATA } from '../data/folders';
import { getPosterDataUrl } from '../utils/posterArt';
import { ScreenRect } from './GalleryRoom';

interface GameListViewProps {
  isOpen: boolean;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  onSelectGame: (gameIndex: number, rect: ScreenRect) => void;
}

const GameListView: React.FC<GameListViewProps> = ({
  isOpen,
  activeCategory,
  onCategoryChange,
  onSelectGame,
}) => {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(FOLDER_DATA.map((f) => f.category))).filter(
      (c): c is string => !!c && c !== 'Drills Originals'
    );
    return ['All', 'Drills Originals', ...cats];
  }, []);

  const filteredGames = useMemo(() => {
    return FOLDER_DATA.map((game, index) => ({ game, index })).filter(
      ({ game }) => activeCategory === 'All' || game.category === activeCategory
    );
  }, [activeCategory]);

  const handleCardClick = (gameIndex: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const imgBox = e.currentTarget.querySelector('.print-card-img');
    const r = (imgBox || e.currentTarget).getBoundingClientRect();
    onSelectGame(gameIndex, {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    });
  };

  return (
    <section id="list" className={isOpen ? 'open' : ''} aria-hidden={!isOpen}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <h2 className="list-heading">GAME ARCHIVE — ALL RELEASES</h2>
        <span className="list-count">
          {filteredGames.length} TITLES
        </span>
      </div>

      {/* Category Filter Bar */}
      <div className="list-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`chip-btn ${activeCategory === cat ? 'selected' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="list-grid">
        {filteredGames.map(({ game, index }) => (
          <button
            key={game.title}
            type="button"
            className="print-card"
            onClick={(e) => handleCardClick(index, e)}
          >
            <div className="print-card-img">
              <img
                src={getPosterDataUrl(index)}
                alt={game.content.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <div className="print-card-title">{game.title}</div>
            <div className="print-card-artist">{game.category}</div>
            <div className="print-card-meta">
              #{String(index + 1).padStart(2, '0')} · PLAY
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default GameListView;
