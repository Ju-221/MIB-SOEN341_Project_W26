import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

export const allergies = sqliteTable('allergies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
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
  lactoseIntolerance: integer('lactose_intolerance', { mode: 'boolean' }).default(false),
  glutenIntolerance: integer('gluten_intolerance', { mode: 'boolean' }).default(false)
});

export const dietaryPreferences = sqliteTable('dietary_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  vegetarian: integer('vegetarian', { mode: 'boolean' }).default(false),
  vegan: integer('vegan', { mode: 'boolean' }).default(false),
  pescetarian: integer('pescetarian', { mode: 'boolean' }).default(false),
  halal: integer('halal', { mode: 'boolean' }).default(false),
  kosher: integer('kosher', { mode: 'boolean' }).default(false),
  keto: integer('keto', { mode: 'boolean' }).default(false)
});