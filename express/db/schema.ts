import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { Difficulty } from '../types/index.js';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const allergies = sqliteTable('allergies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  peanuts: integer('peanuts', { mode: 'boolean' }).default(false),
  treeNuts: integer('tree_nuts', { mode: 'boolean' }).default(false),
  eggs: integer('eggs', { mode: 'boolean' }).default(false),
  milk: integer('milk', { mode: 'boolean' }).default(false),
  fish: integer('fish', { mode: 'boolean' }).default(false),
  crustaceans: integer('crustaceans', { mode: 'boolean' }).default(false),
  soy: integer('soy', { mode: 'boolean' }).default(false),
  wheat: integer('wheat', { mode: 'boolean' }).default(false),
  sesame: integer('sesame', { mode: 'boolean' }).default(false),
  mustard: integer('mustard', { mode: 'boolean' }).default(false),
  lactoseIntolerance: integer('lactose_intolerance', {
    mode: 'boolean',
  }).default(false),
  glutenIntolerance: integer('gluten_intolerance', { mode: 'boolean' }).default(false),
});

export const dietaryPreferences = sqliteTable('dietary_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  vegetarian: integer('vegetarian', { mode: 'boolean' }).default(false),
  vegan: integer('vegan', { mode: 'boolean' }).default(false),
  pescetarian: integer('pescetarian', { mode: 'boolean' }).default(false),
  halal: integer('halal', { mode: 'boolean' }).default(false),
  kosher: integer('kosher', { mode: 'boolean' }).default(false),
  keto: integer('keto', { mode: 'boolean' }).default(false),
});

export const recipes = sqliteTable('recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  prepTime: integer('prep_time').notNull(),
  cookTime: integer('cook_time').notNull(),
  difficulty: text('difficulty').$type<Difficulty>().default('Easy').notNull(),
  estimatedCost: real('estimated_cost').notNull(),
  heroImage: text('hero_image'),
  ingredients: text('ingredients').notNull(), // JSON: [{ name, amount, unit }]
  steps: text('steps').notNull(), // JSON: ["Mix flour...", "Bake for 20 min..."]
  categories: text('categories').notNull(), // JSON: ["breakfast", "quick"]
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  dietaryPreferences: text('dietary_preferences'), // json ['vege', 'vegan]
  allergies: text('allergies'), // json [....]
});

export const calendar = sqliteTable('meal_calendar', {
  userId: integer('user_id')
    .primaryKey()
    .notNull()
    .references(() => users.id),
  months: text('months').notNull(), // this has the past 3 months and the current month and the next 3 months. each month shoud be formatted as MONTH_NAME:YEAR
  days: text('days').notNull(), // the days should now be 7 objects each representing the days of a month  from the months seen from the months property
  lastModified: text('last_modified').default(sql`CURRENT_TIMESTAMP`),
});
