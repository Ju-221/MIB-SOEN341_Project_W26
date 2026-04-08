import { vi } from 'vitest';

// Use plain functions for chained/returned values so vi.restoreAllMocks()
// in afterEach does not strip the implementations between tests.

const makeTimeline = () => {
  const tl: Record<string, unknown> = {
    scrollTrigger: { kill() {} },
    kill() {},
  };
  tl.to      = function() { return tl; };
  tl.from    = function() { return tl; };
  tl.fromTo  = function() { return tl; };
  tl.set     = function() { return tl; };
  return tl;
};

const gsapMock = {
  to:             vi.fn(() => ({ scrollTrigger: { kill() {} }, kill() {} })),
  from:           vi.fn(() => ({ scrollTrigger: { kill() {} }, kill() {} })),
  fromTo:         vi.fn(() => ({ scrollTrigger: { kill() {} }, kill() {} })),
  set:            vi.fn(),
  getProperty:    vi.fn(() => 1),
  registerPlugin: vi.fn(),
  timeline:       () => makeTimeline(),
  delayedCall:    (_delay: number, fn: () => void) => { fn(); return { kill() {} }; },
  utils: {
    toArray: () => [] as unknown[],
  },
  core: {
    Timeline: class {},
  },
};

export default gsapMock;
