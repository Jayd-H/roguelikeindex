export interface Tag {
  id: number;
  name: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  subgenre: string;
  narrativePresence: string;
  combatType: string;
  avgRunLength: string;
  timeToFirstWin: string;
  timeTo100: string;
  difficulty: number;
  rngReliance: number;
  userFriendliness: number;
  complexity: number;
  synergyDepth: number;
  replayability: number;
  metaProgression: boolean;
  steamDeckVerified: boolean;
  rating: number;
  tags: Tag[];
  releaseDate?: string | null;
  developer?: string | null;
  publisher?: string | null;
  achievementsCount?: number | null;
  websiteUrl?: string | null;
  supportEmail?: string | null;
  pricing: {
    platform: string;
    stores: {
      store: string;
      price: string;
      url: string;
    }[];
  }[];
  externalRatings: {
    id?: number;
    source: string;
    score: string;
    url: string;
  }[];
  reviews: Review[];
  similarGames: {
    id: string;
    title: string;
    slug: string;
    subgenre: string;
    steamAppId: string | null;
  }[];
}

export interface Review {
  id: string;
  user: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
  gameId: string;
  game?: {
    title: string;
    slug: string;
  };
}

export interface List {
  id: string;
  title: string;
  description: string | null;
  type: 'automatic' | 'user';
  creator: string;
  averageRating: number | null;
  gameCount: number;
  isSaved: boolean;
  userRating: number;
  isOwner: boolean;
  games: {
    id: string;
    slug: string;
    title: string;
    image: string | null;
  }[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  createdAt: string;
  roles: string[];
}