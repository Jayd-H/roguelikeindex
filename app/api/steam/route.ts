import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appid');

  if (!appId) {
    return NextResponse.json({ error: 'App ID required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    const data = await res.json();

    if (data[appId] && data[appId].success) {
      const gameData = data[appId].data;
      
      const headerUrl = gameData.header_image;
      const logoUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/logo.png`;
      const heroUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`;

      return NextResponse.json({
        success: true,
        data: {
          title: gameData.name,
          description: gameData.short_description,
          headerImage: headerUrl,
          heroImage: heroUrl,
          logo: logoUrl,
          releaseDate: gameData.release_date?.date,
          developer: gameData.developers?.[0],
          publisher: gameData.publishers?.[0],
          website: gameData.website,
          achievements: gameData.achievements?.total || 0,
        }
      });
    } else {
      return NextResponse.json({ error: 'Game not found on Steam' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from Steam' }, { status: 500 });
  }
}