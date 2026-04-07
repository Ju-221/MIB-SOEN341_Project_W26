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
  estimatedCost: number;
  heroImage: string | null;
  categories: string[];
}

// Maps feature index → which icon slot lights up
// 0 = Plan Your Week          → bottom (FaCalendarAlt)
// 1 = Create Your Recipes     → left   (HiPencilSquare)
// 2 = Generate Recipes        → right  (AiFillStar)
// 3 = Figure Out What to Cook → top    (mdiPodium)
const FEATURE_ICON_MAP: Record<number, string> = { 0: 'bottom', 1: 'left', 2: 'right', 3: 'top' };
const ICON_FEATURE_MAP: Record<string, number> = { bottom: 0, left: 1, right: 2, top: 3 };

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

  const loadRecipes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  return (
    <div className="homepage">
      {/* Goo blob that drips in from the top after the hero scrolls away */}
      <div className="goo-top" aria-hidden="true" />

      {/* Content panel that sits between the two goo edges */}
      <div className="goo-content" aria-hidden="true">
        <h2 className="goo-section-title">Our features</h2>
        <div className="goo-content-row">
          <div className="goo-features-list">
            {GOO_FEATURES.map((f, i) => (
              <div
                key={i}
                className={`goo-feature-card${hoveredFeature === i ? ' goo-feature-card--active' : ''}${i === 2 ? ' goo-feature-card--generate' : ''}`}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <h3>{f.heading}</h3>
                <p>{f.body}</p>
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
          </span>
        </div>
      </div>

      <div className="goo-bottom" aria-hidden="true" />
      <Hero isLoggedIn={isLoggedIn} />

      <main className="homepage-main">
        {/*<RecentRecipes recipes={recipes} />*/}
        <UserSection isLoggedIn={isLoggedIn} userEmail={userEmail} />
        {/* Spacer — gives the page enough height for the goo + feature-card scroll animations */}
        <div className="homepage-spacer" style={{ height: '600vh' }} />
      </main>

      <CoverFlow recipes={recipes} isLoggedIn={isLoggedIn} />
    </div>
  );
}

export default Homepage;
