const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'efootball.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS valuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      account_details TEXT NOT NULL,
      price_usd REAL NOT NULL,
      converted_price REAL NOT NULL,
      currency TEXT NOT NULL,
      date TEXT NOT NULL
    )
  `);
  console.log('Database initialized successfully');
});

module.exports = db;