const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

function issueToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const { name, email, password } = req.body;
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount) return res.status(409).json({ message: 'An account with this email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    const user = result.rows[0];
    return res.status(201).json({ user, token: issueToken(user) });
  } catch (err) { next(err); }
});

router.post('/login', [
  body('email').trim().isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.')
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email };
    return res.json({ user: safeUser, token: issueToken(safeUser) });
  } catch (err) { next(err); }
});

router.get('/me', auth, (req, res) => res.json({ user: req.user }));

module.exports = router;
