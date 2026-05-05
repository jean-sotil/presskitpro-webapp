import { afterEach, describe, expect, it, vi } from 'vitest';

import { setSink, track } from './track';

afterEach(() => {
  setSink(null);
});

describe('track', () => {
  it('routes events to the registered sink', () => {
    const sink = vi.fn();
    setSink(sink);
    track('onboarding_step_completed', { step: 3 });
    expect(sink).toHaveBeenCalledWith('onboarding_step_completed', { step: 3 });
  });

  it('falls back to console.debug when no sink is registered', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    track('onboarding_step_completed', { step: 1 });
    expect(debugSpy).toHaveBeenCalledWith(
      '[track] onboarding_step_completed',
      { step: 1 },
    );
    debugSpy.mockRestore();
  });

  it('never throws when the sink throws — analytics must not break the flow', () => {
    setSink(() => {
      throw new Error('boom');
    });
    expect(() => track('onboarding_step_completed', { step: 1 })).not.toThrow();
  });

  it('accepts events without props', () => {
    const sink = vi.fn();
    setSink(sink);
    track('wizard_cancelled');
    expect(sink).toHaveBeenCalledWith('wizard_cancelled', undefined);
  });
});
