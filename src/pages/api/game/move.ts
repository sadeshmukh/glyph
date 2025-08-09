import type { APIRoute } from "astro";
import { db, Game } from "astro:db";
import { eq } from "astro:db";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { gameId, playerId, gameState } = body;

    const games = await db.select().from(Game).where(eq(Game.id, gameId));
    if (games.length === 0) {
      return new Response(JSON.stringify({ error: "Game not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const game = games[0];
    const turnOrder = game.turnOrder as string[];
    const currentTurnIndex = (game.state as any).turn || 0;
    const nextTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
    const nextPlayer = turnOrder[nextTurnIndex];

const newGameState = {
      ...(game.state as any),
      ...gameState,
      turn: nextTurnIndex,
      phase: "playing",
    };

    await db
      .update(Game)
      .set({
        state: newGameState,
        currentPlayer: nextPlayer,
        updatedAt: new Date(),
      })
      .where(eq(Game.id, gameId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Move error:", error);
    return new Response(JSON.stringify({ error: "Failed to process move" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
