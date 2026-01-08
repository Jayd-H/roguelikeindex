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
  timeToFirstWin?: string | null;
  hoursPlayed?: string | null;
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
  
  reviews: Review[];
  pricing: PricePoint[];
  externalRatings: ExternalRating[];
  similarGames: SimilarGame[];
}