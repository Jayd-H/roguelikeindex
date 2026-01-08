import axios from 'axios';
import * as cheerio from 'cheerio';
import { HowLongToBeatService } from 'howlongtobeat';
import gplay from 'google-play-scraper';
import { db } from '../lib/db';
import { games, tags, gamesToTags, pricePoints, externalRatings } from '../lib/schema';
import { eq, and, isNull } from 'drizzle-orm';

const hltbService = new HowLongToBeatService();
const DELAY_MS = 2000; // 2 seconds between games to be polite to APIs

const STORE_MAP: Record<string, string> = {
  '1': 'Steam',
  '2': 'GamersGate',
  '3': 'GreenManGaming',
  '7': 'GOG',
  '8': 'Origin',
  '11': 'Humble Store',
  '25': 'Epic Games Store',
};

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helpers (Reused & Improved) ---

async function fetchCompletionTimes(title: string) {
  try {
    const results = await hltbService.search(title);
    if (!results || results.length === 0) return null;

    const bestMatch = results.find(g => g.name.toLowerCase() === title.toLowerCase()) || results[0];
    return {
      main: bestMatch.gameplayMain > 0 ? `${Math.round(bestMatch.gameplayMain)}h` : 'Unknown',
      completionist: bestMatch.gameplayCompletionist > 0 ? `${Math.round(bestMatch.gameplayCompletionist)}h` : 'Unknown'
    };
  } catch {
    return null;
  }
}

async function fetchSteamUserRating(appId: string) {
  try {
    const { data } = await axios.get(`https://store.steampowered.com/appreviews/${appId}?json=1&language=all&purchase_type=all`);
    const summary = data.query_summary;
    if (!summary || summary.total_reviews === 0) return null;

    const score = Math.round((summary.total_positive / summary.total_reviews) * 100);
    return { source: 'Steam', score: `${score}%`, url: `https://store.steampowered.com/app/${appId}#app_reviews_hash` };
  } catch { return null; }
}

async function fetchIgnRating(title: string) {
  try {
    const slug = slugify(title);
    const url = `https://www.ign.com/games/${slug}`;
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    let score = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json.review?.reviewRating?.ratingValue) score = json.review.reviewRating.ratingValue;
        else if (json.aggregateRating?.ratingValue) score = json.aggregateRating.ratingValue;
      } catch { }
    });

    if (!score) return null;
    return { source: 'IGN', score: `${score}/10`, url: url };
  } catch { return null; }
}

async function upsertPrice(gameId: string, platform: string, store: string, price: string, url: string) {
    const existing = await db.select().from(pricePoints)
        .where(and(eq(pricePoints.gameId, gameId), eq(pricePoints.store, store), eq(pricePoints.platform, platform)))
        .get();

    if (existing) {
        if (existing.price !== price) {
            await db.update(pricePoints).set({ price, url }).where(eq(pricePoints.id, existing.id)).run();
            console.log(`     ~ Updated ${store} price: ${price}`);
        }
    } else {
        await db.insert(pricePoints).values({ gameId, platform, store, price, url }).run();
        console.log(`     + Added ${store} price: ${price}`);
    }
}

async function upsertRating(gameId: string, source: string, score: string, url: string) {
    const existing = await db.select().from(externalRatings)
        .where(and(eq(externalRatings.gameId, gameId), eq(externalRatings.source, source)))
        .get();

    if (existing) {
        if (existing.score !== score) {
            await db.update(externalRatings).set({ score, url }).where(eq(externalRatings.id, existing.id)).run();
            console.log(`     ~ Updated ${source} Score: ${score}`);
        }
    } else {
        await db.insert(externalRatings).values({ gameId, source, score, url }).run();
        console.log(`     + Added ${source} Score: ${score}`);
    }
}

// --- Main Updater Logic ---

async function updateGames() {
    console.log("Starting database update scan...");
    
    // Get all games. You could add .where(isNull(games.developer)) here if you ONLY want to fix broken ones.
    const allGames = await db.select().from(games);
    console.log(`Found ${allGames.length} games to check.`);

    for (const game of allGames) {
        console.log(`\nChecking: ${game.title} (ID: ${game.steamAppId || 'N/A'})`);
        
        // 1. STEAM DATA BACKFILL (Developer, Publisher, Release Date, etc.)
        if (game.steamAppId) {
            try {
                // Only fetch Steam data if we are missing fields OR if we want to ensure freshness
                if (!game.developer || !game.releaseDate || !game.achievementsCount) {
                    console.log(`   > Missing core metadata. Fetching from Steam...`);
                    const { data: appData } = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${game.steamAppId}`);
                    
                    if (appData[game.steamAppId]?.success) {
                        const data = appData[game.steamAppId].data;
                        
                        await db.update(games).set({
                            developer: data.developers ? data.developers.join(', ') : 'Unknown',
                            publisher: data.publishers ? data.publishers.join(', ') : 'Unknown',
                            releaseDate: data.release_date?.date || 'Unknown',
                            achievementsCount: data.achievements?.total || 0,
                            websiteUrl: data.website,
                            supportEmail: data.support_info?.email
                        }).where(eq(games.id, game.id)).run();
                        
                        console.log(`     + Updated metadata (Dev/Pub/Date/Achieve)`);
                    }
                }
            } catch (e) {
                console.error(`     ! Failed to fetch Steam details: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
        }

        // 2. REFRESH VOLATILE DATA (Prices, Ratings, HLTB)
        // These can change over time, so we re-check them.

        // -- HLTB --
        if (game.timeToFirstWin === 'Unknown' || game.timeTo100 === 'Unknown') {
             const times = await fetchCompletionTimes(game.title);
             if (times) {
                 await db.update(games).set({
                     timeToFirstWin: times.main,
                     timeTo100: times.completionist
                 }).where(eq(games.id, game.id)).run();
                 console.log(`     + Updated Completion Times: ${times.main} / ${times.completionist}`);
             }
        }

        // -- External Ratings (Steam, IGN) --
        if (game.steamAppId) {
            const steamRating = await fetchSteamUserRating(game.steamAppId);
            if (steamRating) await upsertRating(game.id, 'Steam', steamRating.score, steamRating.url);
        }

        const ignRating = await fetchIgnRating(game.title);
        if (ignRating) await upsertRating(game.id, 'IGN', ignRating.score, ignRating.url);

        // -- Mobile Stores (Google Play / App Store) --
        // Google Play
        try {
            const gpResults = await gplay.search({ term: game.title, num: 1 });
            if (gpResults.length > 0 && gpResults[0].title.toLowerCase().includes(game.title.toLowerCase())) {
                const app = gpResults[0];
                const priceDisplay = app.free ? 'Free' : (app.priceText || 'Paid');
                await upsertPrice(game.id, 'Mobile', 'Google Play', priceDisplay, app.url);
            }
        } catch {}

        // App Store
        try {
            const { data: appleData } = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(game.title)}&entity=software&limit=1`);
            if (appleData.resultCount > 0) {
                 const app = appleData.results[0];
                 if (app.trackName.toLowerCase().includes(game.title.toLowerCase())) {
                     const price = app.formattedPrice || '$' + app.price;
                     await upsertPrice(game.id, 'Mobile', 'App Store', price, app.trackViewUrl);
                 }
            }
        } catch {}

        // -- Third Party PC Prices --
        try {
            const { data: deals } = await axios.get(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(game.title)}&limit=1`);
            if (deals && deals.length > 0) {
                const cheapSharkId = deals[0].gameID;
                const { data: gameDetails } = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${cheapSharkId}`);
                
                for (const offer of gameDetails.deals) {
                    const storeName = STORE_MAP[offer.storeID];
                    if (!storeName || storeName === 'Steam') continue; // We track Steam separately via API
                    
                    await upsertPrice(game.id, 'PC', storeName, `$${offer.price}`, `https://www.cheapshark.com/redirect?dealID=${offer.dealID}`);
                }
            }
        } catch {}

        await delay(DELAY_MS);
    }
    
    console.log("\nUpdate complete!");
}

updateGames();