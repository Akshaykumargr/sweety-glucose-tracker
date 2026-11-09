const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { summarizeReadings, getReportRanges } = require('../utils/reports');

const router = express.Router();
router.use(auth);

function validDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

async function fetchRange(userId, start, end) {
  const result = await db.query(
    `SELECT id, reading_date::text AS date, slot, value
     FROM readings
     WHERE user_id=$1 AND reading_date BETWEEN $2 AND $3
     ORDER BY reading_date ASC, id ASC`,
    [userId, start, end]
  );
  return result.rows;
}

router.get('/daily', async (req, res, next) => {
  const date = req.query.date;
  if (!validDate(date)) return res.status(400).json({ message: 'Please provide a valid date in YYYY-MM-DD format.' });
  try {
    const readings = await fetchRange(req.user.id, date, date);
    res.json({ type: 'daily', range: { start: date, end: date }, ...summarizeReadings(readings), readings });
  } catch (err) { next(err); }
});

router.get('/month-to-date', async (req, res, next) => {
  const date = req.query.date;
  if (!validDate(date)) return res.status(400).json({ message: 'Please provide a valid date in YYYY-MM-DD format.' });
  try {
    const range = getReportRanges(date).monthToDate;
    const readings = await fetchRange(req.user.id, range.start, range.end);
    res.json({ type: 'month-to-date', range, ...summarizeReadings(readings) });
  } catch (err) { next(err); }
});

router.get('/previous-month', async (req, res, next) => {
  const date = req.query.date;
  if (!validDate(date)) return res.status(400).json({ message: 'Please provide a valid date in YYYY-MM-DD format.' });
  try {
    const range = getReportRanges(date).previousMonth;
    const readings = await fetchRange(req.user.id, range.start, range.end);
    res.json({ type: 'previous-month', range, ...summarizeReadings(readings) });
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.validDate = validDate;
