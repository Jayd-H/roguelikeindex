import axios from 'axios';
import * as cheerio from 'cheerio';
import { HowLongToBeatService } from 'howlongtobeat';
import gplay from 'google-play-scraper';
import { db } from '../lib/db';
import { games, tags, gamesToTags, pricePoints, externalRatings } from '../lib/schema';
import { eq } from 'drizzle-orm';

const hltbService = new HowLongToBeatService();

const ROGUELIKE_TAG_ID = '1716';
const GAMES_TO_SCRAPE = 1000;
const DELAY_MS = 2500;

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

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch {
    return null;
  }
}

async function getSteamDeckStatus(appId: string): Promise<boolean> {
  try {
    const { data } = await axios.get(`https://store.steampowered.com/saleaction/ajaxgetdeckcompatibilityreport?nAppID=${appId}`);
    return data.results?.resolved_category === 3;
  } catch {
    return false;
  }
}

async function fetchAppleAppStore(title: string, gameId: string) {
  try {
    const { data } = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(title)}&entity=software&limit=1`);

    if (data.resultCount > 0) {
      const app = data.results[0];
      if (app.trackName.toLowerCase().includes(title.toLowerCase())) {
        await db.insert(pricePoints).values({
          gameId,
          platform: 'Mobile',
          store: 'App Store',
          price: app.formattedPrice || '$' + app.price,
          url: app.trackViewUrl
        }).run();
        console.log(`   + Found on App Store: ${app.formattedPrice}`);
      }
    }
  } catch {
  }
}

async function fetchGooglePlay(title: string, gameId: string) {
  try {
    const results = await gplay.search({ term: title, num: 1 });
    if (results.length > 0) {
      const app = results[0];
      if (app.title.toLowerCase().includes(title.toLowerCase())) {
        const priceDisplay = app.free ? 'Free' : (app.priceText || 'Paid');
        
        await db.insert(pricePoints).values({
          gameId,
          platform: 'Mobile',
          store: 'Google Play',
          price: priceDisplay,
          url: app.url
        }).run();
        console.log(`   + Found on Google Play: ${priceDisplay}`);
      }
    }
  } catch {
  }
}

async function addConsoleLinks(title: string, gameId: string) {
  await db.insert(pricePoints).values({
    gameId,
    platform: 'Xbox',
    store: 'Xbox Store',
    price: 'Check Store',
    url: `https://www.xbox.com/en-US/search?q=${encodeURIComponent(title)}`
  }).run();

  await db.insert(pricePoints).values({
    gameId,
    platform: 'PlayStation',
    store: 'PS Store',
    price: 'Check Store',
    url: `https://store.playstation.com/en-us/search/${slugify(title)}`
  }).run();

  await db.insert(pricePoints).values({
    gameId,
    platform: 'Switch',
    store: 'Nintendo eShop',
    price: 'Check Store',
    url: `https://www.nintendo.com/search/#q=${encodeURIComponent(title)}`
  }).run();
}

async function fetchThirdPartyPrices(title: string, gameId: string) {
  try {
    const { data: deals } = await axios.get(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1`);
    if (!deals || deals.length === 0) return;

    const cheapSharkId = deals[0].gameID;
    const { data: gameDetails } = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${cheapSharkId}`);

    for (const offer of gameDetails.deals) {
      const storeName = STORE_MAP[offer.storeID];
      if (!storeName || storeName === 'Steam') continue;

      await db.insert(pricePoints).values({
        gameId: gameId,
        platform: 'PC',
        store: storeName,
        price: `$${offer.price}`,
        url: `https://www.cheapshark.com/redirect?dealID=${offer.dealID}`
      }).run();
    }
  } catch { }
}

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

async function scrapeSteam() {
  let start = 0;
  const collectedGames: { id: string; title: string }[] = [];
  const seenIds = new Set<string>();

  console.log(`Targeting ${GAMES_TO_SCRAPE} unique games...`);

  while (collectedGames.length < GAMES_TO_SCRAPE) {
    const searchUrl = `https://store.steampowered.com/search/results/?start=${start}&count=100&tags=${ROGUELIKE_TAG_ID}&category1=998&supportedlang=english&infinite=1`;
    
    try {
      const { data: searchHtml } = await axios.get(searchUrl);
      const $ = cheerio.load(searchHtml.results_html || searchHtml);
      let foundInBatch = 0;

      $('.search_result_row').each((_, el) => {
        const id = $(el).attr('data-ds-appid');
        const title = $(el).find('.title').text().trim();
        
        if (id && title && !seenIds.has(id)) {
          seenIds.add(id);
          collectedGames.push({ id, title });
          foundInBatch++;
        }
      });

      console.log(`Batch fetched: ${foundInBatch} new games. Total unique: ${collectedGames.length}`);

      if (foundInBatch === 0) {
        console.log("No more games found in search.");
        break;
      }

      start += 100;
      await delay(1000); 

    } catch {
      console.log("Search batch failed, retrying...");
      await delay(2000);
    }
  }

  const uniqueGames = collectedGames.slice(0, GAMES_TO_SCRAPE);
  console.log(`Starting detailed processing for ${uniqueGames.length} games...`);

  for (const [index, gameInfo] of uniqueGames.entries()) {
    const appId = gameInfo.id;
    const slug = slugify(gameInfo.title);

    const existing = await db.select().from(games).where(eq(games.slug, slug)).get();

    if (existing) {
      const isDummyData = /^\d+$/.test(existing.id);
      if (!isDummyData) {
        console.log(`${index + 1}. Skipping ${gameInfo.title} (Already Exists)`);
        continue;
      }
      console.log(`${index + 1}. Overwriting dummy data for: ${gameInfo.title}`);
      await db.delete(games).where(eq(games.id, existing.id)).run();
    }

    await delay(DELAY_MS);

    try {
      console.log(`${index + 1}. Processing: ${gameInfo.title}...`);

      const { data: appData } = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
      if (!appData[appId]?.success) continue;
      const gameData = appData[appId].data;
      if (gameData.type !== 'game') continue;

      const [headerBuf, heroBuf, logoBuf, times, steamRating, ignRating, deckVerified] = await Promise.all([
        fetchImageBuffer(`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`),
        fetchImageBuffer(`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`),
        fetchImageBuffer(`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/logo.png`),
        fetchCompletionTimes(gameData.name),
        fetchSteamUserRating(appId),
        fetchIgnRating(gameData.name),
        getSteamDeckStatus(appId)
      ]);

      if (!headerBuf) {
        console.log("   ! No header image found (continuing anyway)");
      }

      const developers = gameData.developers ? gameData.developers.join(', ') : 'Unknown';
      const publishers = gameData.publishers ? gameData.publishers.join(', ') : 'Unknown';
      const releaseDate = gameData.release_date?.date || 'Unknown';
      const achievementCount = gameData.achievements?.total || 0;
      const website = gameData.website || null;
      const support = gameData.support_info?.email || null;

      const newGame = await db.insert(games).values({
        slug,
        steamAppId: appId.toString(),
        title: gameData.name,
        description: gameData.short_description || gameData.detailed_description,
        subgenre: 'Roguelike',
        narrativePresence: 'Environmental',
        combatType: 'Real-Time',
        avgRunLength: 'Unknown',
        timeToFirstWin: times?.main || 'Unknown',
        timeTo100: times?.completionist || 'Unknown',
        difficulty: 5,
        rngReliance: 5,
        userFriendliness: 5,
        complexity: 5,
        synergyDepth: 5,
        replayability: 8,
        metaProgression: true,
        steamDeckVerified: deckVerified,
        rating: 0,
        headerBlob: headerBuf,
        heroBlob: heroBuf,
        logoBlob: logoBuf,
        developer: developers,
        publisher: publishers,
        releaseDate: releaseDate,
        achievementsCount: achievementCount,
        websiteUrl: website,
        supportEmail: support
      }).returning().get();

      if (gameData.price_overview) {
        await db.insert(pricePoints).values({
          platform: 'PC',
          store: 'Steam',
          price: gameData.price_overview.final_formatted,
          url: `https://store.steampowered.com/app/${appId}`,
          gameId: newGame.id
        }).run();
      }

      if (gameData.platforms) {
         if (gameData.platforms.mac) {
             await db.insert(pricePoints).values({ platform: 'Mac', store: 'Steam', price: 'Check Store', url: `https://store.steampowered.com/app/${appId}`, gameId: newGame.id }).run();
         }
         if (gameData.platforms.linux) {
             await db.insert(pricePoints).values({ platform: 'Linux', store: 'Steam', price: 'Check Store', url: `https://store.steampowered.com/app/${appId}`, gameId: newGame.id }).run();
         }
      }

      await Promise.all([
        fetchThirdPartyPrices(gameData.name, newGame.id),
        fetchAppleAppStore(gameData.name, newGame.id),
        fetchGooglePlay(gameData.name, newGame.id),
        addConsoleLinks(gameData.name, newGame.id)
      ]);

      const ratingsToAdd = [];
      if (gameData.metacritic) ratingsToAdd.push({ source: 'Metacritic', score: gameData.metacritic.score.toString(), url: gameData.metacritic.url });
      if (steamRating) ratingsToAdd.push(steamRating);
      if (ignRating) ratingsToAdd.push(ignRating);

      for (const rating of ratingsToAdd) {
        await db.insert(externalRatings).values({
          source: rating.source,
          score: rating.score,
          url: rating.url,
          gameId: newGame.id
        }).run();
      }

      if (gameData.categories) {
        for (const cat of gameData.categories) {
          let tag = await db.select().from(tags).where(eq(tags.name, cat.description)).get();
          if (!tag) {
            tag = await db.insert(tags).values({ name: cat.description }).returning().get();
          }
          await db.insert(gamesToTags).values({ gameId: newGame.id, tagId: tag.id }).run();
        }
      }

    } catch {
      console.error(`Failed to process ${gameInfo.title}`);
    }
  }
}

scrapeSteam();