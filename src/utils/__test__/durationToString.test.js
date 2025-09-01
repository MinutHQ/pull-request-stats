const durationToString = require('../durationToString');

describe('Utils | durationToString', () => {
  it('converts milliseconds to human readable format', () => {
    const result = durationToString(3600000); // 1 hour
    expect(result).toBe('1h');
  });

  it('handles Infinity values', () => {
    const result = durationToString(Infinity);
    expect(result).toBe('∞');
  });

  it('handles negative Infinity values', () => {
    const result = durationToString(-Infinity);
    expect(result).toBe('∞');
  });

  it('handles zero values', () => {
    const result = durationToString(0);
    expect(result).toBe('0m');
  });

  it('handles large values', () => {
    const result = durationToString(86400000); // 1 day
    expect(result).toBe('1d');
  });
});
