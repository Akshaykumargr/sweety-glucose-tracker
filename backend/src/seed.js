require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  const email = 'demo@sweety.local';
  const passwordHash = await bcrypt.hash('SweetyDemo@123', 12);
  const userResult = await db.query(
    `INSERT INTO users(name, email, password_hash)
     VALUES('Sweety Demo', $1, $2)
     ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name
     RETURNING id`,
    [email, passwordHash]
  );
  const userId = userResult.rows[0].id;
  await db.query('DELETE FROM readings WHERE user_id=$1', [userId]);

  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('-');
  const slots = [
    ['morning', 108],
    ['after_breakfast', 142],
    ['after_lunch', 135],
    ['after_dinner', 126]
  ];
  for (const [slot, value] of slots) {
    await db.query(
      'INSERT INTO readings(user_id, reading_date, slot, value) VALUES($1,$2,$3,$4)',
      [userId, today, slot, value]
    );
  }
  console.log('Demo user ready: demo@sweety.local / SweetyDemo@123');
  await db.pool.end();
}

seed().catch(async err => {
  console.error(err);
  await db.pool.end();
  process.exit(1);
});
