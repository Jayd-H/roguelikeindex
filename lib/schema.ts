import { sqliteTable, text, integer, real, blob, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  username: text('username').unique().notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const games = sqliteTable('games', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').unique().notNull(),
  steamAppId: text('steam_app_id'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  subgenre: text('subgenre').notNull(),
  narrativePresence: text('narrative_presence').notNull(),
  combatType: text('combat_type').notNull(),
  avgRunLength: text('avg_run_length').notNull(),
  timeToFirstWin: text('time_to_first_win').notNull(),
  timeTo100: text('time_to_100').notNull(),
  difficulty: integer('difficulty').notNull(),
  rngReliance: integer('rng_reliance').notNull(),
  userFriendliness: integer('user_friendliness').notNull(),
  complexity: integer('complexity').notNull(),
  synergyDepth: integer('synergy_depth').notNull(),
  replayability: integer('replayability').notNull(),
  metaProgression: integer('meta_progression', { mode: 'boolean' }).notNull(),
  steamDeckVerified: integer('steam_deck_verified', { mode: 'boolean' }).notNull(),
  rating: real('rating').notNull(),
  headerBlob: blob('header_blob', { mode: 'buffer' }),
  heroBlob: blob('hero_blob', { mode: 'buffer' }),
  logoBlob: blob('logo_blob', { mode: 'buffer' }),
  releaseDate: text('release_date'),
  developer: text('developer'),
  publisher: text('publisher'),
  achievementsCount: integer('achievements_count'),
  websiteUrl: text('website_url'),
  supportEmail: text('support_email'),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
});

export const gamesToTags = sqliteTable('games_to_tags', {
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.gameId, t.tagId] }),
}));

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user: text('user').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  date: text('date').notNull(),
  timeToFirstWin: text('time_to_first_win'),
  hoursPlayed: text('hours_played'),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
});

export const pricePoints = sqliteTable('price_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  store: text('store').notNull(),
  price: text('price').notNull(),
  url: text('url').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
});

export const externalRatings = sqliteTable('external_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(),
  score: text('score').notNull(),
  url: text('url').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
});

export const gameImages = sqliteTable('game_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
});

export const similarGames = sqliteTable('similar_games', {
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  similarGameId: text('similar_game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.gameId, t.similarGameId] }),
}));

export const favorites = sqliteTable('favorites', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.gameId] }),
}));

export const ownedGames = sqliteTable('owned_games', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.gameId] }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  tags: many(gamesToTags),
  reviews: many(reviews),
  pricing: many(pricePoints),
  externalRatings: many(externalRatings),
  gallery: many(gameImages),
  similarGames: many(similarGames, { relationName: 'isSimilarTo' }),
  favoritedBy: many(favorites),
  ownedBy: many(ownedGames),
}));

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  ownedGames: many(ownedGames),
  reviews: many(reviews),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  games: many(gamesToTags),
}));

export const gamesToTagsRelations = relations(gamesToTags, ({ one }) => ({
  game: one(games, { fields: [gamesToTags.gameId], references: [games.id] }),
  tag: one(tags, { fields: [gamesToTags.tagId], references: [tags.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  game: one(games, { fields: [reviews.gameId], references: [games.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const pricePointsRelations = relations(pricePoints, ({ one }) => ({
  game: one(games, { fields: [pricePoints.gameId], references: [games.id] }),
}));

export const externalRatingsRelations = relations(externalRatings, ({ one }) => ({
  game: one(games, { fields: [externalRatings.gameId], references: [games.id] }),
}));

export const gameImagesRelations = relations(gameImages, ({ one }) => ({
  game: one(games, { fields: [gameImages.gameId], references: [games.id] }),
}));

export const similarGamesRelations = relations(similarGames, ({ one }) => ({
  sourceGame: one(games, { fields: [similarGames.gameId], references: [games.id], relationName: 'isSimilarTo' }),
  targetGame: one(games, { fields: [similarGames.similarGameId], references: [games.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  game: one(games, { fields: [favorites.gameId], references: [games.id] }),
}));

export const ownedGamesRelations = relations(ownedGames, ({ one }) => ({
  user: one(users, { fields: [ownedGames.userId], references: [users.id] }),
  game: one(games, { fields: [ownedGames.gameId], references: [games.id] }),
}));