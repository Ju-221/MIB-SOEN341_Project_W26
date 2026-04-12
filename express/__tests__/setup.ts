import { afterEach } from 'vitest';
import { sqlite } from '../db/index.js';

// Create the full schema in the in-memory database once per test worker.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    first_name  TEXT,
    last_name   TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS allergies (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL UNIQUE REFERENCES users(id),
    peanuts             INTEGER DEFAULT 0,
    tree_nuts           INTEGER DEFAULT 0,
    eggs                INTEGER DEFAULT 0,
    milk                INTEGER DEFAULT 0,
    fish                INTEGER DEFAULT 0,
    crustaceans         INTEGER DEFAULT 0,
    soy                 INTEGER DEFAULT 0,
    wheat               INTEGER DEFAULT 0,
    sesame              INTEGER DEFAULT 0,
    mustard             INTEGER DEFAULT 0,
    lactose_intolerance INTEGER DEFAULT 0,
    gluten_intolerance  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS dietary_preferences (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id),
    vegetarian  INTEGER DEFAULT 0,
    vegan       INTEGER DEFAULT 0,
    pescetarian INTEGER DEFAULT 0,
    halal       INTEGER DEFAULT 0,
    kosher      INTEGER DEFAULT 0,
    keto        INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    created_by           INTEGER NOT NULL REFERENCES users(id),
    title                TEXT NOT NULL,
    description          TEXT NOT NULL,
    prep_time            INTEGER NOT NULL,
    cook_time            INTEGER NOT NULL,
    difficulty           TEXT NOT NULL DEFAULT 'Easy',
    estimated_cost       REAL NOT NULL,
    hero_image           TEXT,
    ingredients          TEXT NOT NULL,
    steps                TEXT NOT NULL,
    categories           TEXT NOT NULL,
    created_at           TEXT DEFAULT CURRENT_TIMESTAMP,
    dietary_preferences  TEXT,
    allergies            TEXT
  );

  CREATE TABLE IF NOT EXISTS meal_calendar (
    user_id       INTEGER PRIMARY KEY NOT NULL REFERENCES users(id),
    months        TEXT NOT NULL,
    days          TEXT NOT NULL,
    last_modified TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function clearDb() {
  sqlite.exec(`
    DELETE FROM meal_calendar;
    DELETE FROM recipes;
    DELETE FROM allergies;
    DELETE FROM dietary_preferences;
    DELETE FROM users;
  `);
}

afterEach(() => {
  clearDb();
});
