const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const readingRoutes = require('./routes/readings');
const reportRoutes = require('./routes/reports');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Sweety API' }));
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

module.exports = app;
