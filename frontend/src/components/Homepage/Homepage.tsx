import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Homepage.css';
import Hero from './Hero';
import RecentRecipes from './RecentRecipes';
import UserSection from './UserSection';
import CoverFlow from './CoverFlow';
import mandala from '../../assets/uploads/mandala.png';
import tacos from '../../assets/uploads/tacos.png';
import Icon from '@mdi/react';
import { mdiPodium } from '@mdi/js';
import { AiFillStar } from 'react-icons/ai';
import { HiPencilSquare } from 'react-icons/hi2';
import { FaCalendarAlt } from 'react-icons/fa';

const GOO_FEATURES = [

  { heading: '•\tPlan Your Week',      body: 'Organize your meals with our meal planner.' },
   { heading: '•\tCreate Your Recipes', body: 'Create from scratch or generate with AI!' },
  { heading: '•\tGenerate Recipes',     body: 'Create new dishes with our AI recipe generator.' },
  { heading: '•\tFigure Out What to Cook',     body: 'Play our decision-making game to discover what you\'re craving!' },
];

gsap.registerPlugin(ScrollTrigger);

interface HomepageProps {
  isLoggedIn: boolean;
  userEmail: string | null;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  estimatedCost: number;
  heroImage: string | null;
  categories: string[];
}

function IconRecipes() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12h8M12 8v8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.2" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg
      className="hp-recipe-placeholder-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconRecipes />,
    title: 'My Recipes',
    desc: 'Build and manage your personal recipe collection. Cook step-by-step or edit on the fly.',
    href: '#recipes',
  },
  {
    icon: <IconCalendar />,
    title: 'Meal Calendar',
    desc: 'Plan every meal for the week. Drag recipes onto any day and stay organised.',
    href: '#calendar',
  },
  {
    icon: <IconAI />,
    title: 'AI Recipe Gen',
    desc: 'Describe what you feel like eating and get a full recipe generated in seconds.',
    href: '#aichat',
  },
  {
    icon: <IconProfile />,
    title: 'Profile',
    desc: 'Set your dietary preferences and allergies so recommendations always fit your lifestyle.',
    href: '#profile',
  },
];

function difficultyBadgeClass(d?: string) {
  if (d === 'Hard') return 'hp-badge hard';
  if (d === 'Medium') return 'hp-badge medium';
  return 'hp-badge easy';
}

function Homepage({ isLoggedIn, userEmail }: HomepageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    const hero = document.querySelector('.homepage-hero') as HTMLElement;
    if (!hero) return;

    // Slide the goo (top + bottom) and reveal the goo-content panel together
    const gooAnim = gsap.to('.goo-top, .goo-bottom', {
      y: '0%',
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'bottom top',
        end: '+=250',
        scrub: 1.5,
      },
    });

    const contentReveal = gsap.to('.goo-content', {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'bottom top',
        end: '+=250',
        scrub: 1.5,
      },
    });

    return () => {
      gooAnim.scrollTrigger?.kill();
      gooAnim.kill();
      contentReveal.scrollTrigger?.kill();
      contentReveal.kill();
    };
  }, []);

  useEffect(() => {
    const spacer = document.querySelector('.homepage-spacer') as HTMLElement;
    if (!spacer) return;

    const titleEl = document.querySelector('.goo-section-title') as HTMLElement;
    const cards = gsap.utils.toArray<HTMLElement>('.goo-feature-card');
    if (titleEl) gsap.set(titleEl, { x: '-110vw', opacity: 0, filter: 'blur(16px)' });
    gsap.set(cards, { x: '-110vw', opacity: 0, filter: 'blur(16px)' });
    gsap.set('.goo-mandala-wrapper', { scale: 0.2, filter: 'blur(20px)', opacity: 0 });
    gsap.set('.tacos', { scale: 0.2, filter: 'blur(20px)', opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: 'top top',
        end: '+=250vh',
        scrub: 2,
      },
    });

    // Title slides in first, then each card after it
    if (titleEl) tl.to(titleEl, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, 0);
    cards.forEach((card, i) => {
      tl.to(card, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, (i + 1) * 1.0);
    });

    tl.to('.goo-mandala-wrapper', { scale: 4, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power2.out' }, 0.5);
    tl.to('.tacos', { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power2.out' }, 0.5);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  // Drive h3/p scale with GSAP so it works regardless of CSS stacking/transform conflicts
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.goo-feature-card');
    cards.forEach((card, i) => {
      const h3 = card.querySelector<HTMLElement>('h3');
      const p  = card.querySelector<HTMLElement>('p');
      const active = hoveredFeature === i;
      if (h3) gsap.to(h3, { scale: active ? 1.1 : 1, duration: 0.2, ease: 'power2.out', overwrite: true });
      if (p)  gsap.to(p,  { scale: active ? 1.07 : 1, duration: 0.2, ease: 'power2.out', overwrite: true });
    });
  }, [hoveredFeature]);

  // Closing animation — goo teeth close together after the feature section
  useEffect(() => {
    const spacer = document.querySelector('.homepage-spacer') as HTMLElement;
    if (!spacer) return;

    const closingTl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: '45% top',        // starts at 270vh into the 600vh spacer — after features finish at 250vh
        end: () => '+=' + window.innerHeight * 2,  // 200vh of scroll to close
        scrub: 2,
        onUpdate: (self) => {
          // Only guard when scrolling forward — reverse scrub must be free to drive opacity.
          // The goo-content fade completes at 30% progress (duration 0.3 of total 1.0).
          // If a faster competing scrub kept the panel visible past that point, hide it via
          // visibility only — don't touch any GSAP-owned opacity so the reverse animation
          // still plays correctly.
          if (self.direction === 1 && self.progress > 0.3) {
            const opacity = gsap.getProperty('.goo-content', 'opacity') as number;
            if (opacity > 0.05) {
              (document.querySelector('.goo-content') as HTMLElement).style.visibility = 'hidden';
            }
          }
        },
        onLeave: () => {
          // Hard stop: teeth are fully closed — guarantee nothing bleeds through.
          (document.querySelector('.goo-content') as HTMLElement).style.visibility = 'hidden';
        },
        onEnterBack: () => {
          // Scrolling back up into the closing section: reveal the panel so GSAP's
          // reverse scrub can animate it back in.
          (document.querySelector('.goo-content') as HTMLElement).style.visibility = 'visible';
        },
      },
    });

    closingTl
      .to('.goo-content', { opacity: 0, ease: 'none', duration: 0.3 }, 0)
      .to('.goo-top',     { height: '64vh', ease: 'power2.inOut', duration: 1 }, 0)
      .to('.goo-bottom',  { height: '64vh', ease: 'power2.inOut', duration: 1 }, 0);

    return () => {
      closingTl.scrollTrigger?.kill();
      closingTl.kill();
    };
  }, []);

  // Hard scroll-position guard: past 75% of page height the features must be invisible.
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrolled = scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const scrollingDown = scrollY > lastScrollY;
      lastScrollY = scrollY;

      const gooContent = document.querySelector('.goo-content') as HTMLElement;
      if (!gooContent) return;

      if (scrollingDown && scrolled >= 0.75) {
        // Only flip visibility — never touch GSAP-owned opacity values so the
        // reverse animation can play freely when scrolling back up.
        gooContent.style.visibility = 'hidden';
      } else if (!scrollingDown && scrolled < 0.75) {
        gooContent.style.visibility = 'visible';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/api/recipes')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Recipe[]) => setRecipes(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-shell">
        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="profile-header">
          <div>
            <h1>
              {isLoggedIn
                ? `Welcome back${userEmail ? `, ${userEmail.split('@')[0]}` : ''}`
                : 'Welcome to MealMajor'}
            </h1>
            <p className="profile-subtitle">
              {isLoggedIn
                ? "Here's a quick look at your app. Jump in from any section below."
                : 'Plan meals, discover recipes, and eat well on a budget. Sign in to get started.'}
            </p>
          </div>
          {!isLoggedIn && (
            <a href="#signin" className="profile-button primary hp-cta">
              Get Started
            </a>
          )}
        </header>

        {/* ── Quick-nav cards ─────────────────────────────────────── */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2>What You Can Do</h2>
          </div>
          <div className="profile-card-body">
            <div className="hp-feature-grid">
              {FEATURES.map((f) => (
                <a key={f.href} href={isLoggedIn ? f.href : '#signin'} className="hp-feature-card">
                  {f.icon}
                  <h3 className="hp-feature-title">{f.title}</h3>
                  <p className="hp-feature-desc">{f.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Recent recipes (only when there are some) ───────────── */}
        {recipes.length > 0 && (
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Recent Recipes</h2>
              {isLoggedIn && (
                <a href="#recipes" className="hp-see-all">
                  See all
                </a>
              )}
            </div>
            <div className="profile-card-body">
              <div className="hp-recipe-grid">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="hp-recipe-card">
                    {recipe.heroImage ? (
                      <img
                        src={`http://localhost:3000/uploads/${recipe.heroImage}`}
                        alt={recipe.title}
                        className="hp-recipe-img"
                      />
                    ) : (
                      <div className="hp-recipe-img-placeholder">
                        <IconImage />
                      </div>
                    )}
                    <div className="hp-recipe-body">
                      <div className="hp-recipe-tags">
                        <span className={difficultyBadgeClass(recipe.difficulty)}>
                          {recipe.difficulty ?? 'Easy'}
                        </span>
                        <span className="hp-badge time">
                          {recipe.prepTime + recipe.cookTime} min
                        </span>
                      </div>
                      <h3 className="hp-recipe-title">{recipe.title}</h3>
                      <p className="hp-recipe-desc">{recipe.description}</p>
                      <span className="hp-recipe-cost">${recipe.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <span className="goo-mandala-wrapper">
            <div className="mandala-icon-ring">
              <img className="goo-mandala" src={mandala} alt="" />
              <img className="tacos" src={tacos} alt="" />
              <span
                className={`mandala-icon mandala-icon-top${hoveredFeature === ICON_FEATURE_MAP['top'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['top'])}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <span className="mandala-icon-inner"><Icon path={mdiPodium} size="1em" /></span>
              </span>
              <span
                className={`mandala-icon mandala-icon-right mandala-icon--generate${hoveredFeature === ICON_FEATURE_MAP['right'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['right'])}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <span className="mandala-icon-inner"><AiFillStar /></span>
              </span>
              <span
                className={`mandala-icon mandala-icon-bottom${hoveredFeature === ICON_FEATURE_MAP['bottom'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['bottom'])}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <span className="mandala-icon-inner"><FaCalendarAlt /></span>
              </span>
              <span
                className={`mandala-icon mandala-icon-left${hoveredFeature === ICON_FEATURE_MAP['left'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['left'])}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <span className="mandala-icon-inner"><HiPencilSquare /></span>
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Homepage;
