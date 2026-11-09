function summarizeReadings(readings) {
  const values = readings.map(r => Number(r.value));
  if (!values.length) {
    return { highest: null, lowest: null, average: null, count: 0 };
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((total / values.length) * 10) / 10,
    count: values.length
  };
}

function getReportRanges(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const selected = new Date(Date.UTC(year, month - 1, day));
  const firstThisMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstPreviousMonth = new Date(Date.UTC(year, month - 2, 1));
  const lastPreviousMonth = new Date(Date.UTC(year, month - 1, 0));
  const fmt = d => d.toISOString().slice(0, 10);

  return {
    daily: { start: dateString, end: dateString },
    monthToDate: { start: fmt(firstThisMonth), end: dateString },
    previousMonth: { start: fmt(firstPreviousMonth), end: fmt(lastPreviousMonth) }
  };
}

module.exports = { summarizeReadings, getReportRanges };
