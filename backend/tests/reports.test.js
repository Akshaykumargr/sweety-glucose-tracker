const { summarizeReadings, getReportRanges } = require('../src/utils/reports');
const { validDate } = require('../src/routes/reports');

describe('report utilities', () => {
  test('validates date in YYYY-MM-DD format', () => {
    expect(validDate('2026-11-09')).toBe(true);
    expect(validDate('2026-02-28')).toBe(true);
    expect(validDate('09-11-2026')).toBe(false);
    expect(validDate('2026/11/09')).toBe(false);
    expect(validDate('invalid')).toBe(false);
    expect(validDate('')).toBe(false);
    expect(validDate(null)).toBe(false);
    expect(validDate('2026-02-31')).toBe(false);
  });
  test('calculates highest, lowest, average and count', () => {
    expect(summarizeReadings([{ value: 100 }, { value: 111 }, { value: 125 }]))
      .toEqual({ highest: 125, lowest: 100, average: 112, count: 3 });
  });

  test('returns empty-state summary', () => {
    expect(summarizeReadings([]))
      .toEqual({ highest: null, lowest: null, average: null, count: 0 });
  });

  test('calculates month-to-date and previous month ranges', () => {
    expect(getReportRanges('2026-10-15')).toEqual({
      daily: { start: '2026-10-15', end: '2026-10-15' },
      monthToDate: { start: '2026-10-01', end: '2026-10-15' },
      previousMonth: { start: '2026-09-01', end: '2026-09-30' }
    });
  });
});
