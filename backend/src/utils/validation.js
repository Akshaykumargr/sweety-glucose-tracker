const SLOTS = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];

function validateReading({ date, slot, value }) {
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 40 || numericValue > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  if (!SLOTS.includes(slot)) {
    return 'Please select a valid time slot.';
  }

  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return 'Please enter a valid date.';
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return 'Please enter a valid date.';
  }

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  if (date > todayString) return 'Date cannot be in the future.';
  return null;
}

module.exports = { SLOTS, validateReading };
