import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';
import {InertiaPlugin} from 'gsap/InertiaPlugin';
import roundPlate from '../../assets/uploads/round-plate.png';
import '../../styles/fonts.css'; // Import Google fonts

gsap.registerPlugin(SplitText);
gsap.registerPlugin(InertiaPlugin);

// TypeScript Interfaces
interface CalloutLine {
  id: string;
  angle: number; // in degrees (0-360)
  label?: string;
}

interface RotatingImageWithCalloutsProps {
  callouts?: CalloutLine[];
} 

// 1. Simple animation (basic square rotating and moving)
const SquareAnimation = () => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    
    gsap.to(".box", { 
      x: 200, 
      rotation: 360, 
      duration: 2,
      repeat: -1,
      yoyo: true 
    });
  }, { scope: container }); 

  return (
    <div ref={container} style={{ padding: '20px' }}>
      <div className="box" style={{ width: 50, height: 50, background: 'skyblue' }} />
    </div>
  );
};

// Inside Animations.tsx
const TextAnimation = () => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // FIX: Change ".title" to ".meal-major-title"
    const split = new SplitText(".meal-major-title", { type: "chars, words" });

    gsap.from(split.chars, {
      opacity: 0,
      y: 50, // Increased movement for better visibility
      stagger: 0.05,
      duration: 1.5, // Reduced from 7s for a punchier entrance
      ease: "back.out"
    });
  }, { scope: container });

  return (
    <div ref={container}>
      <h1 className="meal-major-title">MEAL <br/> MAJOR</h1>
    </div>
  );
};

/**
 * RotatingImageWithCallouts Component
 * 
 * Creates animated callout lines emerging from the center of a circular image.
 * Each line travels diagonally outward, then elbows to horizontal, with a tip circle.
 * Uses GSAP for smooth strokeDashoffset animation.
 */
const RotatingImageWithCallouts: React.FC<RotatingImageWithCalloutsProps> = ({
  callouts = [
    { id: '1', angle: 315, label: 'Filter your meals' },
    { id: '2', angle: 45, label: 'Write recipes' },
    { id: '3', angle: 135, label: 'Add tags' },
    { id: '4', angle: 225, label: 'Be the healthiest you can be!' },
  ],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const circleRefs = useRef<(SVGCircleElement | null)[]>([]);

  /**
   * Convert polar coordinates (angle, distance) to Cartesian (x, y)
   * Center is at (100, 100) in new SVG viewBox
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

    const [elbowX, elbowY] = polarToCartesian(
      centerX,
      centerY,
      imageRadius + elbowDistance,
      angle
    );

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

  useGSAP(() => {
    if (!svgRef.current) return;

    if (imageRef.current) {
      gsap.to(imageRef.current, {
        rotation: 360,
        duration: 40,
        repeat: -1,
        ease: 'none',
      });
    }

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
  }, { scope: containerRef });

  // SVG parameters
  const IMAGE_RADIUS = 35; // Rough radius of image in viewBox (100x100)
  const ELBOW_DISTANCE = 15; // How far beyond image to place elbow
  const HORIZONTAL_LENGTH = 40; // Length of horizontal segment (longer)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px',
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
          pointerEvents: 'none',
          zIndex: 10,
          overflow: 'visible'
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
                ref={(el) => { pathRefs.current[index] = el; }}
                d={pathData}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                ref={(el) => { circleRefs.current[index] = el; }}
                cx={tipX}
                cy={tipY}
                r="1.5"
                fill="rgba(255, 255, 255, 0.6)"
              />
              <text
                ref={(el) => { textRefs.current[index] = el; }}
                x={labelX}
                y={labelY}
                textAnchor={callout.angle < 180 ? 'start' : 'end'}
                dy="0.35em"
                fontSize="7"
                fill="rgba(255, 255, 255, 0.8)"
                fontFamily="'Playfair Display', serif"
                fontWeight="900"
                letterSpacing="0.05em"
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
    </div>
  );
};

// Alias for backwards compatibility - RotatingImage is now the enhanced version with callouts
const RotatingImage = RotatingImageWithCallouts;

export { SquareAnimation, TextAnimation, RotatingImage, RotatingImageWithCallouts };
export type { CalloutLine, RotatingImageWithCalloutsProps };