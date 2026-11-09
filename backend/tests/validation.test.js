const { validateReading } = require('../src/utils/validation');

const today = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
};

describe('reading validation', () => {
  const valid = () => ({ date: today(), slot: 'morning', value: 100 });

  test('accepts a valid reading', () => {
    expect(validateReading(valid())).toBeNull();
  });

  test('requires a value', () => {
    expect(validateReading({ ...valid(), value: '' })).toBe('Please enter a glucose value.');
  });

  test('rejects values outside 40–600 and decimals', () => {
    expect(validateReading({ ...valid(), value: 39 })).toBe('Value must be between 40 and 600 mg/dl.');
    expect(validateReading({ ...valid(), value: 600.5 })).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('rejects invalid slots', () => {
    expect(validateReading({ ...valid(), slot: 'night' })).toBe('Please select a valid time slot.');
  });

  test('rejects future dates', () => {
    expect(validateReading({ ...valid(), date: '2999-01-01' })).toBe('Date cannot be in the future.');
  });
});
