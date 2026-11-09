require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');
const app = require('./app');

async function start() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in .env');
  const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await db.query(schema);
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Sweety API running at http://localhost:${port}`));
}

start().catch(err => {
  console.error('Unable to start server:', err.message);
  process.exit(1);
});
