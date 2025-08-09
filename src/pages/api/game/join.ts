import type { APIRoute } from "astro";
import { db, Game, Player } from "astro:db";
import { eq } from "astro:db";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { gameId, preferredColor } = body;

    if (!gameId || !/^[3-8]{5}$/.test(gameId)) {
      return new Response(JSON.stringify({ error: "Invalid game code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // game
    const games = await db.select().from(Game).where(eq(Game.id, gameId));
    if (games.length === 0) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const game = games[0];
    const players = game.players as Record<string, boolean>;

    let assignedColor = null;
    if (preferredColor && players[preferredColor] === false) {
      assignedColor = preferredColor;
    } else {
      // first available color
      assignedColor =
        Object.keys(players).find((color) => players[color] === false) || null;
    }

    if (!assignedColor) {
      return new Response(JSON.stringify({ error: "Game is full" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const playerId = `player-${assignedColor}-${Date.now()}`;

    players[assignedColor] = true;
    await db
      .update(Game)
      .set({
        players,
        updatedAt: now,
      })
      .where(eq(Game.id, gameId));

    await db.insert(Player).values({
      id: playerId,
      gameId,
      color: assignedColor,
      joinedAt: now,
      lastSeen: now,
    });

    return new Response(
      JSON.stringify({
        success: true,
        playerId,
        assignedColor,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Join game error:", error);
    return new Response(JSON.stringify({ error: "Failed to join game" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
