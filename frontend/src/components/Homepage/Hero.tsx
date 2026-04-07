import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TextAnimation, RotatingImage } from './Animations';
import olives from '../../assets/uploads/olives.png';
import mint from '../../assets/uploads/mint.png';
import tomato from '../../assets/uploads/tomato.png';

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  isLoggedIn: boolean;
}

const MainHeroSection = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mintRef    = useRef<HTMLImageElement>(null);
  const tomatoRef  = useRef<HTMLImageElement>(null);
  const olivesRef  = useRef<HTMLImageElement>(null);

  // Entry animations
  useGSAP(() => {
    if (mintRef.current) {
      gsap.fromTo(mintRef.current,
        { x: -220, y: -180, opacity: 0, rotation: -35 },
        { x: 0,    y: 0,    opacity: 1, rotation: 20,  duration: 1.4, delay: 0.2, ease: 'power3.out' }
      );
    }
    if (tomatoRef.current) {
      gsap.fromTo(tomatoRef.current,
        { x: 220,  y: -180, opacity: 0, rotation: 30 },
        { x: 0,    y: 0,    opacity: 1, rotation: -18, duration: 1.4, delay: 0.35, ease: 'power3.out' }
      );
    }
    if (olivesRef.current) {
      gsap.fromTo(olivesRef.current,
        { x: -200, y: 280, opacity: 0, rotation: 40 },
        { x: 0,    y: 0,   opacity: 1, rotation: -12, duration: 1.4, delay: 0.5, ease: 'power3.out' }
      );
    }
  }, { scope: wrapperRef });

  // Scroll-driven reversal — delayed until entry animations finish so
  // gsap.to captures the correct resting state as the "from" value
  useEffect(() => {
    let tl: gsap.core.Timeline;

    // Longest entry animation: delay 0.5 + duration 1.4 = 1.9s → wait 2s to be safe
    const setup = gsap.delayedCall(2, () => {
      // Query inside the callback so we get the live DOM at animation time
      const hero = document.querySelector('.homepage-hero') as HTMLElement;
      const titleEl = document.querySelector('.meal-major-title') as HTMLElement;
      if (!hero) return;

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
          invalidateOnRefresh: true,
        },
      });

      // Flatten the hero curve as user scrolls
      tl.to(hero, { borderBottomLeftRadius: '0% 0px', borderBottomRightRadius: '0% 0px' }, 0);

      if (titleEl)           tl.to(titleEl,           { y: -80, opacity: 0 },                        0);
      if (mintRef.current)   tl.to(mintRef.current,   { x: -220, y: -180, opacity: 0, rotation: -35 }, 0);
      if (tomatoRef.current) tl.to(tomatoRef.current, { x: 220,  y: -180, opacity: 0, rotation: 30  }, 0);
      if (olivesRef.current) tl.to(olivesRef.current, { x: -200, y: 280,  opacity: 0, rotation: 40  }, 0);

      // Force ScrollTrigger to recalculate positions after delayed creation
      ScrollTrigger.refresh();
    });

    return () => {
      setup.kill();
      tl?.scrollTrigger?.kill();
      tl?.kill();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="meal-major-container" style={{ position: 'relative' }}>

      {/* Mint — top-left corner */}
      <div style={{
        position: 'absolute', left: '3vw', top: '6%',
        width: '25vw', maxWidth: '5770px',
        pointerEvents: 'none', userSelect: 'none', zIndex: 15,
      }}>
        <img ref={mintRef} src={mint} alt="mint"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Tomato — top-right corner */}
      <div style={{
        position: 'absolute', right: '4vw', top: '8%',
        width: '12vw', maxWidth: '1055px',
        pointerEvents: 'none', userSelect: 'none', zIndex: 15,
      }}>
        <img ref={tomatoRef} src={tomato} alt="tomato"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Olives — bottom-left, near the curve */}
      <div style={{
        position: 'absolute', left: '10vw', bottom: '10%',
        width: '20vw', maxWidth: '500px',
        pointerEvents: 'none', userSelect: 'none', zIndex: 15,
      }}>
        <img ref={olivesRef} src={olives} alt="olives"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      <div className="title-image-wrapper">
        {/* Large Background Title */}
        <div className="text-container">
          <TextAnimation />
        </div>

        {/* Rotating Plate and Callouts Overlayed */}
        <div className="plate-container">
          <RotatingImage />
        </div>
      </div>
    </div>
  );
};

const Hero: React.FC<HeroProps> = ({ isLoggedIn }) => {
  const leftRef  = useRef<HTMLElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);

  // Slide in from each side, delayed after the top-element animations (~1.9 s)
  useEffect(() => {
    if (leftRef.current) {
      gsap.fromTo(leftRef.current,
        { x: -180, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, delay: 2.1, ease: 'power3.out' }
      );
    }
    if (rightRef.current) {
      gsap.fromTo(rightRef.current,
        { x: 180, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, delay: 2.1, ease: 'power3.out' }
      );
    }
  }, []);

  const handleViewRecipes = () => {
    const spacer = document.querySelector('.homepage-spacer') as HTMLElement;
    if (spacer) {
      window.scrollTo({ top: spacer.offsetTop + spacer.offsetHeight, behavior: 'smooth' });
    }
  };

  return (
    <header className="homepage-hero">
      <MainHeroSection />

      {/* Bottom-left: welcome back text OR register button */}
      {isLoggedIn
        ? <p ref={leftRef as React.RefObject<HTMLParagraphElement>} className="hero-welcome">Welcome Back</p>
        : <a ref={leftRef as React.RefObject<HTMLAnchorElement>} href="/login" className="hero-corner-btn hero-corner-btn--left">Register now!</a>
      }

      {/* Bottom-right: always visible */}
      <button ref={rightRef} className="hero-corner-btn hero-corner-btn--right" onClick={handleViewRecipes}>
        View recipes
      </button>
    </header>
  );
};

export default Hero;
