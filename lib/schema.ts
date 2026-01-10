import { sqliteTable, text, integer, real, blob, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  username: text('username').unique().notNull(),
  bio: text('bio'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
});

export const usersToRoles = sqliteTable('users_to_roles', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

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
  releaseDate: text('release_date'),
  developer: text('developer'),
  publisher: text('publisher'),
  achievementsCount: integer('achievements_count'),
  websiteUrl: text('website_url'),
  supportEmail: text('support_email'),
}, (t) => ({
  ratingIdx: index('rating_idx').on(t.rating),
  complexityIdx: index('complexity_idx').on(t.complexity),
  releaseDateIdx: index('release_date_idx').on(t.releaseDate),
  subgenreIdx: index('subgenre_idx').on(t.subgenre),
  ratingIdIdx: index('rating_id_idx').on(t.rating, t.id),
  deckVerifiedIdx: index('deck_verified_idx').on(t.steamDeckVerified),
  steamAppIdIdx: index('steam_app_id_idx').on(t.steamAppId),
}));

export const gameBlobs = sqliteTable('game_blobs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  data: blob('data', { mode: 'buffer' }).notNull(),
}, (t) => ({
  gameIdIdx: index('game_blobs_game_id_idx').on(t.gameId),
  gameIdTypeIdx: index('game_blobs_game_id_type_idx').on(t.gameId, t.type),
}));

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
});

export const gamesToTags = sqliteTable('games_to_tags', {
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.gameId, t.tagId] }),
  tagIdIdx: index('games_to_tags_tag_id_idx').on(t.tagId),
}));

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user: text('user').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  date: text('date').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  
  difficulty: integer('difficulty'),
  replayability: integer('replayability'),
  synergyDepth: integer('synergy_depth'),
  complexity: integer('complexity'),
  rngReliance: integer('rng_reliance'),
  userFriendliness: integer('user_friendliness'),
  
  avgRunLength: text('avg_run_length'),
  timeToFirstWin: text('time_to_first_win'),
  timeTo100: text('time_to_100'),
  
  narrativePresence: text('narrative_presence'),
  combatType: text('combat_type'),
}, (t) => ({
  gameIdDateIdx: index('reviews_game_id_date_idx').on(t.gameId, t.date),
  userIdIdx: index('reviews_user_id_idx').on(t.userId),
}));

export const pricePoints = sqliteTable('price_points', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  store: text('store').notNull(),
  price: text('price').notNull(),
  url: text('url').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
}, (t) => ({
  gameIdCoveringIdx: index('price_points_covering_idx').on(t.gameId, t.platform, t.store, t.price, t.url),
}));

export const externalRatings = sqliteTable('external_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  source: text('source').notNull(),
  score: text('score').notNull(),
  url: text('url').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
}, (t) => ({
  gameIdCoveringIdx: index('external_ratings_covering_idx').on(t.gameId, t.source, t.score, t.url),
}));

export const gameImages = sqliteTable('game_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
}, (t) => ({
  gameIdIdx: index('game_images_game_id_idx').on(t.gameId),
}));

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

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true).notNull(),
  averageRating: real('average_rating').default(0),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  userIdIdx: index('lists_user_id_idx').on(t.userId),
}));

export const listItems = sqliteTable('list_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  listId: text('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  order: integer('order').default(0),
  addedAt: text('added_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  listIdIdx: index('list_items_list_id_idx').on(t.listId),
  gameIdIdx: index('list_items_game_id_idx').on(t.gameId),
}));

export const listRatings = sqliteTable('list_ratings', {
  listId: text('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), 
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  pk: primaryKey({ columns: [t.listId, t.userId] }),
}));

export const savedLists = sqliteTable('saved_lists', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listId: text('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  savedAt: text('saved_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.listId] }),
}));

export const rateLimits = sqliteTable('rate_limits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  action: text('action').notNull(),
  count: integer('count').notNull().default(1),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  keyActionIdx: index('rate_limits_key_action_idx').on(t.key, t.action),
}));

export const suggestions = sqliteTable('suggestions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetField: text('target_field').notNull(), 
  operation: text('operation').notNull(), 
  originalValue: text('original_value', { mode: 'json' }), 
  suggestedValue: text('suggested_value', { mode: 'json' }).notNull(), 
  voteCount: integer('vote_count').default(0).notNull(),
  status: text('status').default('pending').notNull(), 
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, (t) => ({
  gameIdIdx: index('suggestions_game_id_idx').on(t.gameId),
  userIdIdx: index('suggestions_user_id_idx').on(t.userId),
}));

export const suggestionVotes = sqliteTable('suggestion_votes', {
  suggestionId: text('suggestion_id').notNull().references(() => suggestions.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  vote: integer('vote').notNull(), 
}, (t) => ({
  pk: primaryKey({ columns: [t.suggestionId, t.userId] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(usersToRoles),
  favorites: many(favorites),
  ownedGames: many(ownedGames),
  reviews: many(reviews),
  lists: many(lists),
  listRatings: many(listRatings),
  savedLists: many(savedLists),
  suggestions: many(suggestions),
  suggestionVotes: many(suggestionVotes),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(usersToRoles),
}));

export const usersToRolesRelations = relations(usersToRoles, ({ one }) => ({
  user: one(users, { fields: [usersToRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [usersToRoles.roleId], references: [roles.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  tags: many(gamesToTags),
  reviews: many(reviews),
  pricing: many(pricePoints),
  externalRatings: many(externalRatings),
  gallery: many(gameImages),
  blobs: many(gameBlobs),
  similarGames: many(similarGames, { relationName: 'isSimilarTo' }),
  favoritedBy: many(favorites),
  ownedBy: many(ownedGames),
  listedIn: many(listItems),
  suggestions: many(suggestions),
}));

export const gameBlobsRelations = relations(gameBlobs, ({ one }) => ({
  game: one(games, { fields: [gameBlobs.gameId], references: [games.id] }),
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

export const listsRelations = relations(lists, ({ one, many }) => ({
  creator: one(users, { fields: [lists.userId], references: [users.id] }),
  items: many(listItems),
  ratings: many(listRatings),
  saves: many(savedLists),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(lists, { fields: [listItems.listId], references: [lists.id] }),
  game: one(games, { fields: [listItems.gameId], references: [games.id] }),
}));

export const listRatingsRelations = relations(listRatings, ({ one }) => ({
  list: one(lists, { fields: [listRatings.listId], references: [lists.id] }),
  user: one(users, { fields: [listRatings.userId], references: [users.id] }),
}));

export const savedListsRelations = relations(savedLists, ({ one }) => ({
  list: one(lists, { fields: [savedLists.listId], references: [lists.id] }),
  user: one(users, { fields: [savedLists.userId], references: [users.id] }),
}));

export const suggestionsRelations = relations(suggestions, ({ one, many }) => ({
  game: one(games, { fields: [suggestions.gameId], references: [games.id] }),
  user: one(users, { fields: [suggestions.userId], references: [users.id] }),
  votes: many(suggestionVotes),
}));

export const suggestionVotesRelations = relations(suggestionVotes, ({ one }) => ({
  suggestion: one(suggestions, { fields: [suggestionVotes.suggestionId], references: [suggestions.id] }),
  user: one(users, { fields: [suggestionVotes.userId], references: [users.id] }),
}));