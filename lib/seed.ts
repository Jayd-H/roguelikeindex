import { db } from './db';
import { games, tags, gamesToTags, reviews, pricePoints, externalRatings, gameImages, similarGames } from './schema';
import { eq } from 'drizzle-orm';

// --- PASTE YOUR BASE GAMES DATA HERE (Remove Types) ---
const baseGames = [
  {
    id: "1",
    title: "Slay the Spire",
    steamAppId: "646570",
    description: "A deck-building roguelike where you craft a unique deck, encounter bizarre creatures, discover relics of immense power, and slay the Spire.",
    subgenre: "Deckbuilder",
    narrativePresence: "Light",
    combatType: "Card-Based",
    avgRunLength: "50m",
    timeToFirstWin: "15h",
    timeTo100: "150h",
    difficulty: 7,
    rngReliance: 6,
    userFriendliness: 9,
    complexity: 7,
    synergyDepth: 10,
    replayability: 10,
    metaProgression: true,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$24.99", url: "#" }, { store: "Epic", price: "$24.99", url: "#" }] },
      { platform: "Mobile", stores: [{ store: "Apple App Store", price: "$9.99", url: "#" }, { store: "Google Play", price: "$9.99", url: "#" }] },
      { platform: "Switch", stores: [{ store: "eShop", price: "$24.99", url: "#" }] }
    ],
    rating: 4.8,
    tags: ["Card Battler", "Strategy", "Singleplayer"],
    externalRatings: [
      { source: "Metacritic", score: "89", url: "#" }, 
      { source: "Steam", score: "97%", url: "#" }
    ],
    reviews: [
      { user: "RogueFan99", rating: 5, comment: "Absolutely addicted. The synergy system is incredible.", date: "2 days ago", timeToFirstWin: "18h", hoursPlayed: "200h+" },
      { user: "CasualGamer", rating: 4, comment: "Hard but fair. Love the art style.", date: "1 week ago", hoursPlayed: "15h" }
    ],
    similarGames: ["6", "8"]
  },
  {
    id: "2",
    title: "Hades",
    steamAppId: "1145360",
    description: "Defy the god of the dead as you hack and slash out of the Underworld in this dungeon crawler from the creators of Bastion and Transistor.",
    subgenre: "Action",
    narrativePresence: "Story-Rich",
    combatType: "Real-Time",
    avgRunLength: "35m",
    timeToFirstWin: "20h",
    timeTo100: "90h",
    difficulty: 6,
    rngReliance: 4,
    userFriendliness: 10,
    complexity: 6,
    synergyDepth: 8,
    replayability: 9,
    metaProgression: true,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$24.99", url: "#" }, { store: "Epic", price: "$24.99", url: "#" }] },
      { platform: "Switch", stores: [{ store: "eShop", price: "$24.99", url: "#" }] },
      { platform: "PlayStation", stores: [{ store: "PS Store", price: "$24.99", url: "#" }] }
    ],
    rating: 4.9,
    tags: ["Story Rich", "Hack & Slash", "Mythology"],
    externalRatings: [
      { source: "Metacritic", score: "93", url: "#" }, 
      { source: "IGN", score: "9/10", url: "#" }
    ],
    reviews: [],
    similarGames: ["3", "5"]
  },
  {
    id: "3",
    title: "Dead Cells",
    steamAppId: "588650",
    description: "A rogue-lite, metroidvania inspired, action-platformer. You'll explore a sprawling, ever-changing castle... assuming you're able to fight your way past its keepers.",
    subgenre: "Action",
    narrativePresence: "Environmental",
    combatType: "Real-Time",
    avgRunLength: "55m",
    timeToFirstWin: "25h",
    timeTo100: "120h",
    difficulty: 8,
    rngReliance: 5,
    userFriendliness: 8,
    complexity: 7,
    synergyDepth: 8,
    replayability: 9,
    metaProgression: true,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$24.99", url: "#" }] },
      { platform: "Mobile", stores: [{ store: "Apple App Store", price: "$8.99", url: "#" }] }
    ],
    rating: 4.7,
    tags: ["Metroidvania", "Pixel Art", "Fast-Paced"],
    externalRatings: [{ source: "Metacritic", score: "89", url: "#" }],
    reviews: [],
    similarGames: ["2", "5"]
  },
  {
    id: "4",
    title: "Into the Breach",
    steamAppId: "590380",
    description: "Control powerful mechs from the future to defeat an alien threat. Each attempt to save the world presents a new randomly generated challenge.",
    subgenre: "Turn-Based",
    narrativePresence: "Light",
    combatType: "Turn-Based",
    avgRunLength: "75m",
    timeToFirstWin: "10h",
    timeTo100: "60h",
    difficulty: 9,
    rngReliance: 2,
    userFriendliness: 8,
    complexity: 8,
    synergyDepth: 6,
    replayability: 8,
    metaProgression: false,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$14.99", url: "#" }] },
      { platform: "Mobile", stores: [{ store: "Netflix", price: "Free", url: "#" }] }
    ],
    rating: 4.8,
    tags: ["Tactical", "Sci-Fi", "Puzzle"],
    externalRatings: [{ source: "Metacritic", score: "90", url: "#" }],
    reviews: [],
    similarGames: ["1"]
  },
  {
    id: "5",
    title: "The Binding of Isaac: Rebirth",
    steamAppId: "250900",
    description: "A randomly generated action RPG shooter with heavy heavy Rogue-like elements. Following Isaac on his journey players will find bizarre treasures.",
    subgenre: "Action",
    narrativePresence: "Environmental",
    combatType: "Real-Time",
    avgRunLength: "40m",
    timeToFirstWin: "12h",
    timeTo100: "400h+",
    difficulty: 8,
    rngReliance: 8,
    userFriendliness: 6,
    complexity: 8,
    synergyDepth: 10,
    replayability: 10,
    metaProgression: true,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$14.99", url: "#" }] }
    ],
    rating: 4.9,
    tags: ["Dark", "Shooter", "Top-Down"],
    externalRatings: [{ source: "Metacritic", score: "88", url: "#" }],
    reviews: [],
    similarGames: ["2", "3"]
  },
  {
    id: "6",
    title: "Monster Train",
    steamAppId: "1102190",
    description: "Hell has frozen over. Only you can protect the final burning pyre from the forces of heaven and restore the inferno. Strategic deckbuilding with a twist.",
    subgenre: "Deckbuilder",
    narrativePresence: "Light",
    combatType: "Card-Based",
    avgRunLength: "45m",
    timeToFirstWin: "8h",
    timeTo100: "100h",
    difficulty: 6,
    rngReliance: 5,
    userFriendliness: 9,
    complexity: 7,
    synergyDepth: 9,
    replayability: 8,
    metaProgression: true,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$24.99", url: "#" }] }
    ],
    rating: 4.7,
    tags: ["Tower Defense", "Strategy", "Demons"],
    externalRatings: [{ source: "Metacritic", score: "86", url: "#" }],
    reviews: [],
    similarGames: ["1", "8"]
  },
  {
    id: "7",
    title: "Caves of Qud",
    steamAppId: "333640",
    description: "A science fantasy roguelike epic steeped in retrofuturism, deep simulation, and swathes of sentient plants. Come chisel through a layer cake of thousand-year-old civilizations.",
    subgenre: "Traditional",
    narrativePresence: "Environmental",
    combatType: "Turn-Based",
    avgRunLength: "Var",
    timeToFirstWin: "60h",
    timeTo100: "Infinite",
    difficulty: 10,
    rngReliance: 7,
    userFriendliness: 4,
    complexity: 10,
    synergyDepth: 9,
    replayability: 10,
    metaProgression: false,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$19.99", url: "#" }, { store: "GOG", price: "$19.99", url: "#" }] }
    ],
    rating: 4.6,
    tags: ["Open World", "Simulation", "Complex"],
    externalRatings: [{ source: "Steam", score: "95%", url: "#" }],
    reviews: [],
    similarGames: []
  },
  {
    id: "8",
    title: "Balatro",
    steamAppId: "2379780",
    description: "A poker-inspired roguelike deck builder all about creating illegal poker hands, discovering game-changing jokers, and triggering adrenaline-pumping combos.",
    subgenre: "Deckbuilder",
    narrativePresence: "None",
    combatType: "Card-Based",
    avgRunLength: "35m",
    timeToFirstWin: "6h",
    timeTo100: "80h",
    difficulty: 7,
    rngReliance: 8,
    userFriendliness: 10,
    complexity: 6,
    synergyDepth: 9,
    replayability: 10,
    metaProgression: true,
    steamDeckVerified: true,
    pricing: [
      { platform: "PC", stores: [{ store: "Steam", price: "$14.99", url: "#" }] },
      { platform: "Mobile", stores: [{ store: "App Store", price: "$9.99", url: "#" }] }
    ],
    rating: 4.9,
    tags: ["Card Game", "Psychedelic", "Gambling"],
    externalRatings: [{ source: "Metacritic", score: "90", url: "#" }],
    reviews: [],
    similarGames: ["1", "6"]
  }
];

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

async function main() {
  console.log("Seeding database...");
  
  // Clear existing data (order matters for foreign keys)
  db.delete(similarGames).run();
  db.delete(gameImages).run();
  db.delete(externalRatings).run();
  db.delete(pricePoints).run();
  db.delete(reviews).run();
  db.delete(gamesToTags).run();
  db.delete(tags).run();
  db.delete(games).run();

  for (const gameData of baseGames) {
    const slug = slugify(gameData.title);

    // 1. Insert Game
    db.insert(games).values({
      id: gameData.id,
      slug,
      title: gameData.title,
      steamAppId: gameData.steamAppId,
      description: gameData.description,
      subgenre: gameData.subgenre,
      narrativePresence: gameData.narrativePresence,
      combatType: gameData.combatType,
      avgRunLength: gameData.avgRunLength,
      timeToFirstWin: gameData.timeToFirstWin,
      timeTo100: gameData.timeTo100,
      difficulty: gameData.difficulty,
      rngReliance: gameData.rngReliance,
      userFriendliness: gameData.userFriendliness,
      complexity: gameData.complexity,
      synergyDepth: gameData.synergyDepth,
      replayability: gameData.replayability,
      metaProgression: gameData.metaProgression,
      steamDeckVerified: gameData.steamDeckVerified,
      rating: gameData.rating,
    }).run();

    // 2. Handle Tags (Upsert)
    for (const tagName of gameData.tags) {
      // Try to find existing tag
      let tag = db.select().from(tags).where(eq(tags.name, tagName)).get();
      
      // If not exists, insert
      if (!tag) {
        const result = db.insert(tags).values({ name: tagName }).returning().get();
        tag = result;
      }

      // Link Game to Tag
      db.insert(gamesToTags).values({
        gameId: gameData.id,
        tagId: tag.id
      }).run();
    }

    // 3. Insert Prices
    for (const p of gameData.pricing) {
        for (const s of p.stores) {
            db.insert(pricePoints).values({
                platform: p.platform,
                store: s.store,
                price: s.price,
                url: s.url,
                gameId: gameData.id
            }).run();
        }
    }

    // 4. Insert Reviews
    for (const r of gameData.reviews) {
        db.insert(reviews).values({
            user: r.user,
            rating: r.rating,
            comment: r.comment,
            date: r.date,
            timeToFirstWin: r.timeToFirstWin,
            hoursPlayed: r.hoursPlayed,
            gameId: gameData.id
        }).run();
    }

    // 5. External Ratings
    for (const ex of gameData.externalRatings) {
        db.insert(externalRatings).values({
            source: ex.source,
            score: ex.score,
            url: ex.url,
            gameId: gameData.id
        }).run();
    }

    // 6. Gallery
    if (gameData.steamAppId) {
        db.insert(gameImages).values({ url: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${gameData.steamAppId}/ss_1.jpg`, gameId: gameData.id }).run();
        db.insert(gameImages).values({ url: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${gameData.steamAppId}/ss_2.jpg`, gameId: gameData.id }).run();
    }
  }

  // 7. Similar Games (done after all games exist)
  for (const gameData of baseGames) {
      if (gameData.similarGames) {
          for (const simId of gameData.similarGames) {
              const exists = db.select().from(games).where(eq(games.id, simId)).get();
              if (exists) {
                  db.insert(similarGames).values({
                      gameId: gameData.id,
                      similarGameId: simId
                  }).run();
              }
          }
      }
  }

  console.log("Seeding complete!");
}

main();