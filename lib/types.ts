export interface Tag {
  id: number;
  name: string;
}

export interface Review {
  id: string;
  user: string;
  userId?: string | null;
  rating: number;
  comment: string;
  date: string;
  
  difficulty?: number | null;
  replayability?: number | null;
  synergyDepth?: number | null;
  complexity?: number | null;
  rngReliance?: number | null;
  userFriendliness?: number | null;
  
  avgRunLength?: string | null;
  timeToFirstWin?: string | null;
  timeTo100?: string | null;
  
  narrativePresence?: string | null;
  combatType?: string | null;
  
  game?: {
    title: string;
    slug: string;
  };
}

export interface PricePoint {
  platform: string;
  stores: { store: string; price: string; url: string }[];
}

export interface ExternalRating {
  source: string;
  score: string;
  url: string;
}

export interface SimilarGame {
  id: string;
  slug: string;
  title: string;
  steamAppId?: string | null;
  subgenre: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  subgenre: string;
  combatType: string;
  narrativePresence: string;
  avgRunLength: string;
  difficulty: number;
  rating: number;
  complexity: number;
  metaProgression: boolean;
  steamDeckVerified: boolean;
  steamAppId: string | null;
  tags: Tag[];
  
  rngReliance: number;
  userFriendliness: number;
  synergyDepth: number;
  replayability: number;
  timeToFirstWin: string;
  timeTo100: string;
  
  developer?: string | null;
  publisher?: string | null;
  releaseDate?: string | null;
  
  reviews: Review[];
  pricing: PricePoint[];
  externalRatings: ExternalRating[];
  similarGames: SimilarGame[];
}

export interface List {
  id: string;
  title: string;
  description: string | null;
  type: "automatic" | "user";
  creator?: string;
  averageRating?: number | null;
  gameCount: number;
  games: { id: string; slug: string; title: string; image: string | null }[];
  isSaved?: boolean;
  userRating?: number;
  isOwner?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  createdAt: string;
}