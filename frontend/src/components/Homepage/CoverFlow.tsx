import React, { useState, useEffect } from 'react';
import './CoverFlow.css';

interface Recipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  estimatedCost: number;
  heroImage: string | null;
  categories: string[];
}

interface CoverFlowProps {
  recipes: Recipe[];
  isLoggedIn: boolean;
}

const VISIBLE_SIDE = 3;

function getCardStyle(offset: number): React.CSSProperties {
  const abs = Math.abs(offset);

  if (abs > VISIBLE_SIDE) {
    return { opacity: 0, pointerEvents: 'none', transform: 'translateX(0px) rotateY(0deg) scale(0.3)', zIndex: 0 };
  }

  if (offset === 0) {
    return {
      transform: 'translateX(0px) rotateY(0deg) scale(1)',
      zIndex: 20,
      opacity: 1,
    };
  }

  const side = Math.sign(offset); // -1 for left, +1 for right
  const translateX = side * (210 + (abs - 1) * 115);
  // Left cards (side=-1): rotateY positive → right edge faces viewer (toward center)
  // Right cards (side=+1): rotateY negative → left edge faces viewer (toward center)
  const rotateY = side * -52;
  const scale = Math.max(0.55, 0.8 - (abs - 1) * 0.08);
  const zIndex = 20 - abs;
  const opacity = abs === VISIBLE_SIDE ? 0.45 : 1;

  return {
    transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
    zIndex,
    opacity,
  };
}

const CoverFlow: React.FC<CoverFlowProps> = ({ recipes, isLoggedIn }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  setActiveIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setActiveIndex(i => Math.min(recipes.length - 1, i + 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [recipes.length]);

  if (!isLoggedIn) {
    return (
      <section className="coverflow-section">
        <div className="coverflow-spotlight" aria-hidden="true" />
        <div className="coverflow-gate">
          <p className="coverflow-gate-label">Your personal recipe collection awaits</p>
          <p className="coverflow-gate-sub">Sign in to browse, create, and discover recipes curated for you.</p>
          <a href="/login" className="coverflow-signin-btn">Sign In</a>
        </div>
      </section>
    );
  }

  if (recipes.length === 0) {
    return (
      <section className="coverflow-section">
        <div className="coverflow-spotlight" aria-hidden="true" />
        <p className="coverflow-empty-text">No result.</p>
      </section>
    );
  }

  const active = recipes[activeIndex];

  return (
    <section className="coverflow-section">
      <div className="coverflow-spotlight" aria-hidden="true" />

      <h2 className="coverflow-heading">Scroll through your recipes</h2>

      <div className="coverflow-stage">
        {recipes.map((recipe, i) => {
          const offset = i - activeIndex;
          return (
            <div
              key={recipe.id}
              className={`coverflow-card${offset === 0 ? ' coverflow-card--active' : ''}`}
              style={getCardStyle(offset)}
              onClick={() => offset !== 0 && setActiveIndex(i)}
              aria-label={recipe.title}
            >
              {recipe.heroImage
                ? <img src={`http://localhost:3000${recipe.heroImage}`} alt={recipe.title} draggable={false} />
                : <div className="coverflow-card-placeholder" />
              }
              <div className="coverflow-card-overlay">
                <p className="coverflow-card-title">{recipe.title}</p>
                <span className="coverflow-card-meta">
                  {recipe.prepTime + recipe.cookTime} min
                  {recipe.categories[0] && ` · ${recipe.categories[0]}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active recipe details */}
      <div className="coverflow-details">
        <p className="coverflow-active-title">{active.title}</p>
        <p className="coverflow-active-desc">{active.description}</p>
      </div>

      {/* Navigation */}
      <nav className="coverflow-nav" aria-label="Recipe navigation">
        <button
          className="coverflow-nav-btn"
          onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          aria-label="Previous recipe"
        >
          ‹
        </button>
        <div className="coverflow-dots">
          {recipes.map((_, i) => (
            <button
              key={i}
              className={`coverflow-dot${i === activeIndex ? ' coverflow-dot--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to recipe ${i + 1}`}
            />
          ))}
        </div>
        <button
          className="coverflow-nav-btn"
          onClick={() => setActiveIndex(i => Math.min(recipes.length - 1, i + 1))}
          disabled={activeIndex === recipes.length - 1}
          aria-label="Next recipe"
        >
          ›
        </button>
      </nav>
    </section>
  );
};

export default CoverFlow;
