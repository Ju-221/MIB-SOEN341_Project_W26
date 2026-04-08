import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { heading: 'Create Your Recipes', body: 'Create from scratch or generate with AI!' },
  { heading: 'Plan Your Week',      body: 'Organize your meals with our meal planner.' },
  { heading: 'Save Money',          body: 'Find the best deals and reduce food waste.' },
];

const FeatureSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = gsap.utils.toArray<HTMLElement>('.feature-slide-card', section);

    // Start each card off-screen to the right
    gsap.set(cards, { x: '120vw', opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        // Each card gets ~40vh of scroll distance; title gets ~20vh
        end: `+=${features.length * 40 + 20}vh`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Section title fades up first
    tl.from('.feature-section-title', { opacity: 0, y: 30, duration: 0.3 }, 0);

    // Cards slide in from the right, one by one
    cards.forEach((card, i) => {
      tl.to(card, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.3 + i * 0.5);
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="homepage-features">
      <h2 className="homepage-section-title feature-section-title">What You Can Do</h2>
      <div className="homepage-feature-grid">
        {features.map((f, i) => (
          <div key={i} className="homepage-feature-card feature-slide-card">
            <h3>{f.heading}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
