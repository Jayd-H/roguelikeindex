import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { games } from '@/lib/schema';

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const slug = params.slug;

  const game = await db.query.games.findFirst({
    where: eq(games.slug, slug),
    with: {
      tags: {
        with: { tag: true }
      },
      pricing: true,
      externalRatings: true,
      reviews: true,
      gallery: true,
      similarGames: {
        with: {
          targetGame: {
            columns: {
                id: true,
                title: true,
                slug: true,
                steamAppId: true,
                subgenre: true
            }
          }
        }
      }
    }
  });

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  // Define the shape of our accumulated pricing object
  type PricingAccumulator = {
    [key: string]: {
      platform: string;
      stores: { store: string; price: string; url: string }[];
    };
  };

  const formattedGame = {
    ...game,
    tags: game.tags.map(t => t.tag),
    similarGames: game.similarGames.map(sg => sg.targetGame),
    pricing: Object.values(
      game.pricing.reduce<PricingAccumulator>((acc, curr) => {
        if (!acc[curr.platform]) {
          acc[curr.platform] = { platform: curr.platform, stores: [] };
        }
        acc[curr.platform].stores.push({ 
          store: curr.store, 
          price: curr.price, 
          url: curr.url 
        });
        return acc;
      }, {})
    )
  };

  return NextResponse.json(formattedGame);
}