// Chainable GSAP stub — every method returns the timeline so .to().to() works.
const makeTimeline = (): any => {
  const tl: any = {
    to:           (..._a: any[]) => tl,
    from:         (..._a: any[]) => tl,
    set:          (..._a: any[]) => tl,
    kill:         () => {},
    scrollTrigger: null,
  };
  return tl;
};

const noop = () => ({});

const gsap: any = {
  to:             noop,
  from:           noop,
  fromTo:         noop,
  set:            noop,
  timeline:       () => makeTimeline(),
  registerPlugin: () => {},
  getProperty:    () => 0,
  utils:          { toArray: (_sel: any) => [] },
  delayedCall:    (_d: number, fn: () => void) => { fn(); return { kill: () => {} }; },
};

const ScrollTrigger = {
  create:   noop,
  refresh:  () => {},
  getAll:   () => [],
  kill:     () => {},
};

export { gsap as default, ScrollTrigger };
