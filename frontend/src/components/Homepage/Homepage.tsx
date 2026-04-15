import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Homepage.css';
import Hero from './Hero';

const mandala = '/images/mandala.png';
const tacos = '/images/tacos.png';
import Icon from '@mdi/react';
import { mdiPodium } from '@mdi/js';
import { AiFillStar } from 'react-icons/ai';
import { HiPencilSquare } from 'react-icons/hi2';
import { FaCalendarAlt } from 'react-icons/fa';

const ZIGZAG_FEATURES = [
  {
    id: 1,
    heading: '•\tPlan Your Week',
    body: 'Organize your meals with our meal planner.',
    route: '#calendar',
  },
  {
    id: 2,
    heading: '•\tCreate Your Recipes',
    body: 'Create from scratch or generate with AI!',
    route: '#recipes',
  },
  {
    id: 3,
    heading: '•\tGenerate Recipes',
    body: 'Create new dishes with our AI recipe generator.',
    route: '#aichat',
  },
  {
    id: 4,
    heading: '•\tFigure Out What to Cook',
    body: "Play our decision-making game to discover what you're craving!",
    route: '#unique',
  },
];

gsap.registerPlugin(ScrollTrigger);

interface HomepageProps {
  isLoggedIn: boolean;
  userEmail: string | null;
}

// Maps feature index → which icon slot lights up
// 0 = Plan Your Week          → bottom (FaCalendarAlt)
// 1 = Create Your Recipes     → left   (HiPencilSquare)
// 2 = Generate Recipes        → right  (AiFillStar)
// 3 = Figure Out What to Cook → top    (mdiPodium)
const ICON_FEATURE_MAP: Record<string, number> = { bottom: 0, left: 1, right: 2, top: 3 };

function Homepage({ isLoggedIn }: HomepageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    const hero = document.querySelector('.homepage-hero') as HTMLElement;
    if (!hero) return;

    // Slide the zigzag (top + bottom) and reveal the zigzag-content panel together
    const zigzagAnim = gsap.to('.zigzag-top, .zigzag-bottom', {
      y: '0%',
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'bottom top',
        end: '+=250',
        scrub: 1.5,
      },
    });

    const contentReveal = gsap.to('.zigzag-content', {
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
      zigzagAnim.scrollTrigger?.kill();
      zigzagAnim.kill();
      contentReveal.scrollTrigger?.kill();
      contentReveal.kill();
    };
  }, []);

  useEffect(() => {
    const spacer = document.querySelector('.homepage-spacer') as HTMLElement;
    if (!spacer) return;

    const titleEl = document.querySelector('.zigzag-section-title') as HTMLElement;
    const cards = gsap.utils.toArray<HTMLElement>('.zigzag-feature-card');
    if (titleEl) gsap.set(titleEl, { x: '-110vw', opacity: 0, filter: 'blur(16px)' });
    gsap.set(cards, { x: '-110vw', opacity: 0, filter: 'blur(16px)' });
    gsap.set('.zigzag-mandala-wrapper', { scale: 0.2, filter: 'blur(20px)', opacity: 0 });
    gsap.set('.tacos', { scale: 0.2, filter: 'blur(20px)', opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: 'top top',
        end: '+=170vh',
        scrub: 2,
      },
    });

    // Title slides in first, then each card after it
    if (titleEl)
      tl.to(
        titleEl,
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' },
        0
      );
    cards.forEach((card, i) => {
      tl.to(
        card,
        { x: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'power3.out' },
        (i + 1) * 1
      );
    });

    tl.to(
      '.zigzag-mandala-wrapper',
      { scale: 4, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power2.out' },
      0.5
    );
    tl.to(
      '.tacos',
      { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power2.out' },
      0.5
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  // Drive h3/p scale with GSAP so it works regardless of CSS stacking/transform conflicts
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.zigzag-feature-card');
    cards.forEach((card, i) => {
      const h3 = card.querySelector<HTMLElement>('h3');
      const p = card.querySelector<HTMLElement>('p');
      const active = hoveredFeature === i;
      if (h3)
        gsap.to(h3, {
          scale: active ? 1.1 : 1,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: true,
        });
      if (p)
        gsap.to(p, {
          scale: active ? 1.07 : 1,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: true,
        });
    });
  }, [hoveredFeature]);

  // Closing animation — zigzag teeth close together after the feature section
  useEffect(() => {
    const spacer = document.querySelector('.homepage-spacer') as HTMLElement;
    if (!spacer) return;

    gsap.set('.bon-appetit-title, .bon-appetit-sub', { opacity: 0, y: 50, filter: 'blur(16px)' });

    const closingTl = gsap.timeline({
      scrollTrigger: {
        trigger: spacer,
        start: '43% top',
        // innerHeight * 1.3 (~130vh) keeps the end well within the page's max scroll
        end: () => '+=' + window.innerHeight * 1.3,
        scrub: 1.5,
        onUpdate: (self) => {
          if (self.direction === 1 && self.progress > 0.85) {
            const opacity = gsap.getProperty('.zigzag-content', 'opacity') as number;
            if (opacity > 0.05) {
              (document.querySelector('.zigzag-content') as HTMLElement).style.visibility =
                'hidden';
            }
          }
        },
        onLeave: () => {
          (document.querySelector('.zigzag-content') as HTMLElement).style.visibility = 'hidden';
          // Teeth are fully closed — reveal Bon Appétit
          const overlay = document.querySelector('.bon-appetit-overlay') as HTMLElement;
          if (overlay) overlay.style.visibility = 'visible';
          gsap.killTweensOf('.bon-appetit-title, .bon-appetit-sub');
          gsap.set('.bon-appetit-title, .bon-appetit-sub', { y: 50, filter: 'blur(16px)' });
          gsap.to('.bon-appetit-title', {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
          });
          gsap.to('.bon-appetit-sub', {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.9,
            delay: 0.5,
            ease: 'power3.out',
          });
        },
        onEnterBack: () => {
          (document.querySelector('.zigzag-content') as HTMLElement).style.visibility = 'visible';
          // Teeth are re-opening — instantly kill and hide Bon Appétit so fast
          // scrolling can't leave it stranded mid-screen
          gsap.killTweensOf('.bon-appetit-title, .bon-appetit-sub');
          gsap.set('.bon-appetit-title, .bon-appetit-sub', {
            opacity: 0,
            y: 50,
            filter: 'blur(16px)',
          });
          const overlay = document.querySelector('.bon-appetit-overlay') as HTMLElement;
          if (overlay) overlay.style.visibility = 'hidden';
        },
      },
    });

    // Teeth close over the full scroll window; features fade out in sync with the teeth
    // so users see the content disappearing as the jaws close around it.
    closingTl
      .to('.zigzag-top', { height: '64vh', ease: 'power2.inOut', duration: 1 }, 0)
      .to('.zigzag-bottom', { height: '64vh', ease: 'power2.inOut', duration: 1 }, 0)
      .to(
        '.zigzag-section-title, .zigzag-feature-card, .zigzag-mandala-wrapper, .tacos',
        { opacity: 0, ease: 'power1.in', duration: 0.7 },
        0
      )
      .to('.zigzag-content', { opacity: 0, ease: 'power1.in', duration: 0.8 }, 0.1);

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

      const zigzagContent = document.querySelector('.zigzag-content') as HTMLElement;
      if (!zigzagContent) return;

      if (scrollingDown && scrolled >= 0.72) {
        // Only flip visibility — never touch GSAP-owned opacity values so the
        // reverse animation can play freely when scrolling back up.
        zigzagContent.style.visibility = 'hidden';
      } else if (!scrollingDown && scrolled < 0.72) {
        zigzagContent.style.visibility = 'visible';
        // Guard: if user scrubs back above the closing zone, force-hide the overlay
        const overlay = document.querySelector('.bon-appetit-overlay') as HTMLElement;
        if (overlay && overlay.style.visibility !== 'hidden') {
          gsap.killTweensOf('.bon-appetit-title, .bon-appetit-sub');
          gsap.set('.bon-appetit-title, .bon-appetit-sub', {
            opacity: 0,
            y: 50,
            filter: 'blur(16px)',
          });
          overlay.style.visibility = 'hidden';
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="homepage">
      {/* Zigzag blob that drips in from the top after the hero scrolls away */}
      <div className="zigzag-top" aria-hidden="true" />

      {/* Content panel that sits between the two zigzag edges */}
      <div className="zigzag-content" aria-hidden="true">
        <h2 className="zigzag-section-title">Our features</h2>
        <div className="zigzag-content-row">
          <div className="zigzag-features-list">
            {ZIGZAG_FEATURES.map((f, i) => (
              <div
                key={f.id}
                role="button"
                className={`zigzag-feature-card${hoveredFeature === i ? ' zigzag-feature-card--active' : ''}${i === 2 ? ' zigzag-feature-card--generate' : ''}`}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => {
                  window.location.hash = f.route;
                }}
              >
                <h3>{f.heading}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
          <span className="zigzag-mandala-wrapper">
            <div className="mandala-icon-ring">
              <img className="zigzag-mandala" src={mandala} alt="" />
              <img className="tacos" src={tacos} alt="" />
              <span
                role="button"
                className={`mandala-icon mandala-icon-top${hoveredFeature === ICON_FEATURE_MAP['top'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['top'])}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => {
                  window.location.hash = ZIGZAG_FEATURES[ICON_FEATURE_MAP['top']].route;
                }}
              >
                <span className="mandala-icon-inner">
                  <Icon path={mdiPodium} size="1em" />
                </span>
              </span>
              <span
                role="button"
                className={`mandala-icon mandala-icon-right mandala-icon--generate${hoveredFeature === ICON_FEATURE_MAP['right'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['right'])}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => {
                  window.location.hash = ZIGZAG_FEATURES[ICON_FEATURE_MAP['right']].route;
                }}
              >
                <span className="mandala-icon-inner">
                  <AiFillStar />
                </span>
              </span>
              <span
                role="button"
                className={`mandala-icon mandala-icon-bottom${hoveredFeature === ICON_FEATURE_MAP['bottom'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['bottom'])}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => {
                  window.location.hash = ZIGZAG_FEATURES[ICON_FEATURE_MAP['bottom']].route;
                }}
              >
                <span className="mandala-icon-inner">
                  <FaCalendarAlt />
                </span>
              </span>
              <span
                role="button"
                className={`mandala-icon mandala-icon-left${hoveredFeature === ICON_FEATURE_MAP['left'] ? ' mandala-icon--active' : ''}`}
                onMouseEnter={() => setHoveredFeature(ICON_FEATURE_MAP['left'])}
                onMouseLeave={() => setHoveredFeature(null)}
                onClick={() => {
                  window.location.hash = ZIGZAG_FEATURES[ICON_FEATURE_MAP['left']].route;
                }}
              >
                <span className="mandala-icon-inner">
                  <HiPencilSquare />
                </span>
              </span>
            </div>
          </span>
        </div>
      </div>

      <div className="zigzag-bottom" aria-hidden="true" />

      {/* Bon Appétit closing overlay — appears after zigzag teeth fully close */}
      <div className="bon-appetit-overlay" aria-hidden="true">
        <h2 className="bon-appetit-title">Bon Appétit!</h2>
        <p className="bon-appetit-sub">
          Powered by: The <span className="bon-appetit-mib">MIB</span> Team
        </p>
      </div>

      <Hero isLoggedIn={isLoggedIn} />

      <main className="homepage-main">
        <div className="homepage-spacer" style={{ height: '460vh' }} />
      </main>
    </div>
  );
}

export default Homepage;
