import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TextAnimation, RotatingImage } from './Animations';
import olives from '../../assets/uploads/olives.png';
import mint from '../../assets/uploads/mint.png';
import tomato from '../../assets/uploads/tomato.png';

interface HeroProps {
  isLoggedIn: boolean;
}

const MainHeroSection = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mintRef    = useRef<HTMLImageElement>(null);
  const tomatoRef  = useRef<HTMLImageElement>(null);
  const olivesRef  = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    // Mint — slides in from top-left
    if (mintRef.current) {
      gsap.fromTo(mintRef.current,
        { x: -220, y: -180, opacity: 0, rotation: -35 },
        { x: 0,    y: 0,    opacity: 1, rotation: 20,  duration: 1.4, delay: 0.2, ease: 'power3.out' }
      );
    }
    // Tomato — slides in from top-right
    if (tomatoRef.current) {
      gsap.fromTo(tomatoRef.current,
        { x: 220,  y: -180, opacity: 0, rotation: 30 },
        { x: 0,    y: 0,    opacity: 1, rotation: -18, duration: 1.4, delay: 0.35, ease: 'power3.out' }
      );
    }
    // Olives — slides in from bottom-left
    if (olivesRef.current) {
      gsap.fromTo(olivesRef.current,
        { x: -200, y: 280, opacity: 0, rotation: 40 },
        { x: 0,    y: 0,   opacity: 1, rotation: -12, duration: 1.4, delay: 0.5, ease: 'power3.out' }
      );
    }
  }, { scope: wrapperRef });

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
  return (
    <header className="homepage-hero">
      <MainHeroSection />
    </header>
  );
};

export default Hero;
