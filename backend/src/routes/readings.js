const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { validateReading } = require('../utils/validation');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, reading_date::text AS date, slot, value
       FROM readings WHERE user_id = $1 ORDER BY reading_date DESC, id DESC`,
      [req.user.id]
    );
    res.json({ readings: result.rows });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const error = validateReading(req.body);
  if (error) return res.status(400).json({ message: error });
  const { date, slot, value } = req.body;
  try {
    const count = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id=$1 AND reading_date=$2',
      [req.user.id, date]
    );
    if (count.rows[0].count >= 4) return res.status(400).json({ message: 'You can add only 4 readings per day.' });

    const result = await db.query(
      `INSERT INTO readings(user_id, reading_date, slot, value)
       VALUES($1, $2, $3, $4)
       RETURNING id, reading_date::text AS date, slot, value`,
      [req.user.id, date, slot, Number(value)]
    );
    res.status(201).json({ reading: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `You already have an ${slotLabel(slot)} reading for this date.` });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const error = validateReading(req.body);
  if (error) return res.status(400).json({ message: error });
  const { date, slot, value } = req.body;
  try {
    const result = await db.query(
      `UPDATE readings SET reading_date=$1, slot=$2, value=$3, updated_at=NOW()
       WHERE id=$4 AND user_id=$5
       RETURNING id, reading_date::text AS date, slot, value`,
      [date, slot, Number(value), req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Reading not found.' });
    res.json({ reading: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: `You already have an ${slotLabel(slot)} reading for this date.` });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM readings WHERE id=$1 AND user_id=$2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Reading not found.' });
    res.json({ message: 'Reading deleted successfully.' });
  } catch (err) { next(err); }
});

function slotLabel(slot) {
  return {
    morning: 'Morning (fasting)',
    after_breakfast: 'After breakfast',
    after_lunch: 'After lunch',
    after_dinner: 'After dinner'
  }[slot] || slot;
}

module.exports = router;
