import type { APIRoute } from "astro";
import { db, Game, Player } from "astro:db";
import { eq } from "astro:db";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const gameId = url.searchParams.get("gameId");
  const playerId = url.searchParams.get("playerId");

  if (!gameId || !playerId) {
    return new Response("Missing gameId or playerId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      const pollInterval = setInterval(async () => {
        try {
          const games = await db
            .select()
            .from(Game)
            .where(eq(Game.id, gameId as any));
          if (games.length > 0) {
            const game = games[0];

            const players = await db
              .select()
              .from(Player)
              .where(eq(Player.gameId, gameId as any));
            const activePlayers = players.map((p) => ({
              id: p.id,
              color: p.color,
              joinedAt: p.joinedAt,
            }));

            const gameState = game.state as any;
            const shouldStart =
              activePlayers.length >= 2 && gameState.phase === "waiting";

            let finalGameState = { ...gameState, players: activePlayers };

            if (shouldStart) {
              finalGameState = { ...finalGameState, phase: "playing" };
              await db
                .update(Game)
                .set({
                  state: finalGameState,
                  updatedAt: new Date(),
                })
                .where(eq(Game.id, gameId as any));
            }

            const message = `data: ${JSON.stringify({
              type: "gameUpdate",
              gameState: finalGameState,
              currentPlayer: game.currentPlayer,
              timestamp: Date.now(),
            })}\n\n`;

            controller.enqueue(encoder.encode(message));
          }
        } catch (error) {
          console.error("SSE polling error:", error);
        }
      }, 1000);

      // keepalive ping every 30 seconds
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (error) {
          clearInterval(keepAlive);
          clearInterval(pollInterval);
        }
      }, 30000);

      return () => {
        clearInterval(pollInterval);
        clearInterval(keepAlive);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
};
