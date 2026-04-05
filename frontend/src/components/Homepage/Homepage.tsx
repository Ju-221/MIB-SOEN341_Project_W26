import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Homepage.css';
import Hero from './Hero';
import RecentRecipes from './RecentRecipes';
import UserSection from './UserSection';
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

    const cards = gsap.utils.toArray<HTMLElement>('.goo-feature-card');
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

    cards.forEach((card, i) => {
      tl.to(card, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' }, i * 1.0);
    });

    tl.to('.goo-mandala-wrapper', { scale: 4, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power2.out' }, 0.5);
    tl.to('.tacos', { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power2.out' }, 0.5);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
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
        <div className="goo-features-list">
          {GOO_FEATURES.map((f, i) => (
            <div
              key={i}
              className={`goo-feature-card${hoveredFeature === i ? ' goo-feature-card--active' : ''}${i === 2 ? ' goo-feature-card--generate' : ''}`}
            >
              <h3
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >{f.heading}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
        <span className="goo-mandala-wrapper">
          <div className="mandala-icon-ring">
            <img className="goo-mandala" src={mandala} alt="" />
            <img className="tacos" src={tacos} alt="" />
            <span className={`mandala-icon mandala-icon-top${hoveredFeature !== null && FEATURE_ICON_MAP[hoveredFeature] === 'top' ? ' mandala-icon--active' : ''}`}>
              <span className="mandala-icon-inner"><Icon path={mdiPodium} size="1em" /></span>
            </span>
            <span className={`mandala-icon mandala-icon-right mandala-icon--generate${hoveredFeature !== null && FEATURE_ICON_MAP[hoveredFeature] === 'right' ? ' mandala-icon--active' : ''}`}>
              <span className="mandala-icon-inner"><AiFillStar /></span>
            </span>
            <span className={`mandala-icon mandala-icon-bottom${hoveredFeature !== null && FEATURE_ICON_MAP[hoveredFeature] === 'bottom' ? ' mandala-icon--active' : ''}`}>
              <span className="mandala-icon-inner"><FaCalendarAlt /></span>
            </span>
            <span className={`mandala-icon mandala-icon-left${hoveredFeature !== null && FEATURE_ICON_MAP[hoveredFeature] === 'left' ? ' mandala-icon--active' : ''}`}>
              <span className="mandala-icon-inner"><HiPencilSquare /></span>
            </span>
          </div>
        </span>
      </div>

      <div className="goo-bottom" aria-hidden="true" />
      <Hero isLoggedIn={isLoggedIn} />

      <main className="homepage-main">
        {/*<RecentRecipes recipes={recipes} />*/}
        <UserSection isLoggedIn={isLoggedIn} userEmail={userEmail} />
        {/* Spacer — gives the page enough height for the goo + feature-card scroll animations */}
        <div className="homepage-spacer" style={{ height: '400vh' }} />
      </main>

    
    </div>
  );
}

export default Homepage;
