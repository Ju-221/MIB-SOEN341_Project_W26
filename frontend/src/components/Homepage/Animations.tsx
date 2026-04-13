/*# The following file was drafted originally, but enhanced with the assistance of Claude.
#Prompt example: I want lines emerging from the the center of the round plate, with angles 30, 115, 245, and 315 degrees.
Each line should travel diagonally outward, then  horizontal, with a small circle at the end, Like the draft lines of a blueprint
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import roundPlate from '../../assets/uploads/round-plate.png';
import chopsticks from '../../assets/uploads/chopsticks.png';

gsap.registerPlugin(SplitText, InertiaPlugin, ScrollTrigger);

// TypeScript Interfaces
interface CalloutLine {
  id: string;
  angle: number; // in degrees (0-360)
  label?: string;
}

interface RotatingImageWithCalloutsProps {
  callouts?: CalloutLine[];
}

// Inside Animations.tsx
const TextAnimation = () => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const split = new SplitText('.meal-major-title', { type: 'chars, words' });

      gsap.from(split.chars, {
        opacity: 0,
        y: 50,
        stagger: 0.05,
        duration: 1.5,
        ease: 'back.out',
      });
    },
    { scope: container }
  );

  return (
    <div ref={container}>
      <h1 className="meal-major-title">
        MEAL <br /> MAJOR
      </h1>
    </div>
  );
};

/**
 * RotatingImageWithCallouts Component
 *
 * Creates animated callout lines emerging from the center of a circular image.
 * Each line travels diagonally outward, then elbows to horizontal, with a tip circle.
 * Uses GSAP for smooth strokeDashoffset animation.
 *
 * SVG viewBox is 350×100 (3.5:1) so the bowl sits in the center third
 * and labels have room on both sides without overflowing.
 */
const RotatingImageWithCallouts: React.FC<RotatingImageWithCalloutsProps> = ({
  callouts = [
    { id: '1', angle: 315, label: 'Filter your meals' },
    { id: '2', angle: 30, label: 'Write recipes' },
    { id: '3', angle: 115, label: 'Add tags' },
    { id: '4', angle: 245, label: 'Be organized' },
  ],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);
  const chopstickRef = useRef<HTMLImageElement>(null);

  /**
   * Convert polar coordinates (angle, distance) to Cartesian (x, y)
   */
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ): [number, number] => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return [
      centerX + radius * Math.cos(angleInRadians),
      centerY + radius * Math.sin(angleInRadians),
    ];
  };

  const generateCalloutPath = (
    angle: number,
    imageRadius: number,
    elbowDistance: number,
    horizontalLength: number
  ): { pathData: string; tipX: number; tipY: number; labelX: number; labelY: number } => {
    const centerX = 50;
    const centerY = 50;

    const [elbowX, elbowY] = polarToCartesian(centerX, centerY, imageRadius + elbowDistance, angle);

    const isRightSide = angle < 180;
    const tipX = isRightSide ? elbowX + horizontalLength : elbowX - horizontalLength;
    const tipY = elbowY;

    const labelOffsetX = isRightSide ? 8 : -8;
    const labelX = tipX + labelOffsetX;
    const labelY = tipY;

    const pathData = `M ${centerX} ${centerY} L ${elbowX} ${elbowY} L ${tipX} ${tipY}`;

    return { pathData, tipX, tipY, labelX, labelY };
  };

  const textRefs = useRef<(SVGTextElement | null)[]>([]);

  useGSAP(
    () => {
      if (!svgRef.current) return;

      // Rotate bowl
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          rotation: 360,
          duration: 40,
          repeat: -1,
          ease: 'none',
        });
      }

      // Animate callout lines, circles and labels
      pathRefs.current.forEach((path, index) => {
        if (!path) return;
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.2,
          delay: index * 0.2,
          ease: 'power2.out',
        });

        const circle = circleRefs.current[index];
        if (circle) {
          gsap.set(circle, { opacity: 0, scale: 0 });
          gsap.to(circle, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            delay: index * 0.2 + 1.2, // Starts after line animation ends
            ease: 'back.out',
          });
        }

        const text = textRefs.current[index];
        if (text) {
          gsap.set(text, {
            opacity: 0,
          });

          gsap.to(text, {
            opacity: 1,
            duration: 0.5,
            delay: index * 0.2 + 1.2,
            ease: 'power2.out',
          });
        }
      });

      // Chopstick: slide up from below and fade in
      if (chopstickRef.current) {
        gsap.fromTo(
          chopstickRef.current,
          { y: 500, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.5, delay: 0.4, ease: 'power3.out' }
        );
      }
    },
    { scope: containerRef }
  );

  // Scroll-driven reversal — delayed until entry animations finish so
  // gsap.to captures the correct resting state as the "from" value
  useEffect(() => {
    let tl: gsap.core.Timeline;

    // Longest entry animation: delay 0.4 + duration 1.5 = 1.9s → wait 2s to be safe
    const setup = gsap.delayedCall(0.0001, () => {
      // Query inside the callback so we get the live DOM at animation time
      const hero = document.querySelector('.homepage-hero') as HTMLElement;
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

      if (imageRef.current) tl.to(imageRef.current, { y: -60, scale: 0.5, opacity: 0 }, 0);
      if (chopstickRef.current) tl.to(chopstickRef.current, { y: 500, opacity: 0 }, 0);
      if (svgRef.current) tl.to(svgRef.current, { opacity: 0 }, 0);

      // Force ScrollTrigger to recalculate positions after delayed creation
      ScrollTrigger.refresh();
    });

    return () => {
      setup.kill();
      tl?.scrollTrigger?.kill();
      tl?.kill();
    };
  }, []);

  // ── Responsive SVG parameters ──────────────────────────────────────────────
  // Track the container's rendered pixel width so we can scale line length and
  // font size proportionally.  Design baseline is 480 px (maxWidth of container).
  const [containerW, setContainerW] = useState(480);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Ratio clamped to [0.35, 1] so labels never become unreadably tiny
  const ratio = Math.min(Math.max(containerW / 480, 0.35), 1);

  const IMAGE_RADIUS = 35;
  const ELBOW_DISTANCE = 15;
  const HORIZONTAL_LENGTH = Math.round(40 * ratio); // shrinks on small screens

  // Font is expressed in SVG user-units (viewBox 0 0 100 100).
  // The SVG element itself already scales 1:1 with the container, so the
  // letters scale automatically — no need to multiply by ratio here.
  // 3 SVG units ≈ 14 px at 480 px container, ≈ 10 px at 320 px.
  const LABEL_FONT_SIZE = 5.2;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '480px',
        aspectRatio: '1',
      }}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          overflow: 'visible',
        }}
      >
        {callouts.map((callout, index) => {
          const { pathData, tipX, tipY, labelX, labelY } = generateCalloutPath(
            callout.angle,
            IMAGE_RADIUS,
            ELBOW_DISTANCE,
            HORIZONTAL_LENGTH
          );

          return (
            <g key={callout.id}>
              <path
                ref={(el) => {
                  pathRefs.current[index] = el;
                }}
                d={pathData}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'none' }}
              />
              <circle
                ref={(el) => {
                  circleRefs.current[index] = el;
                }}
                cx={tipX}
                cy={tipY}
                r="1.5"
                fill="rgba(255, 255, 255, 0.6)"
                style={{ pointerEvents: 'none' }}
              />
              <text
                ref={(el) => {
                  textRefs.current[index] = el;
                }}
                x={labelX}
                y={labelY}
                textAnchor={callout.angle < 180 ? 'start' : 'end'}
                dy="0.35em"
                fontSize={LABEL_FONT_SIZE}
                fill="rgba(255, 255, 255, 0.8)"
                fontFamily="'Caveat', serif"
                fontWeight="900"
                letterSpacing="0.05em"
                style={{ pointerEvents: 'auto', cursor: 'default' }}
                onMouseEnter={(e) =>
                  gsap.to(e.currentTarget, {
                    attr: { fontSize: LABEL_FONT_SIZE * 1.9 },
                    duration: 0.2,
                    ease: 'back.out(2)',
                    overwrite: true,
                  })
                }
                onMouseLeave={(e) =>
                  gsap.to(e.currentTarget, {
                    attr: { fontSize: LABEL_FONT_SIZE },
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: true,
                  })
                }
              >
                {callout.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Central Rotating Image */}
      <img
        ref={imageRef}
        src={roundPlate}
        alt="Rotating center"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          objectFit: 'cover',
          cursor: 'grab',
          userSelect: 'none',
          zIndex: 20,
        }}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Chopsticks wrapper : right edge flush with the screen's right edge,
          vertically centred alongside the bowl. The wrapper handles positioning;
          the img is what GSAP animates so there are no CSS-transform conflicts. */}
      <div
        style={{
          position: 'absolute',
          /* Pull right edge all the way to the viewport's right edge:
             right = (containerWidth - 100vw) / 2  (negative → extends rightward) */
          right: 'calc((100% - 100vw) / 2)',
          top: '30%',
          transform: 'translateY(-50%)',
          width: '42vw',
          zIndex: 25,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <img
          ref={chopstickRef}
          src={chopsticks}
          alt="chopsticks"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
};

// Alias for backwards compatibility
const RotatingImage = RotatingImageWithCallouts;

export { TextAnimation, RotatingImage, RotatingImageWithCallouts };
export type { CalloutLine, RotatingImageWithCalloutsProps };
