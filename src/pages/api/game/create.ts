import type { APIRoute } from "astro";
import { db, Game } from "astro:db";

export const prerender = false;

function generateGameCode(): string {
  // tri to oct, 7 being circle
  const digits = [];
  for (let i = 0; i < 5; i++) {
    digits.push(Math.floor(Math.random() * 6) + 3);
  }
  return digits.join("");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { colors } = body;

    if (!colors || !Array.isArray(colors) || colors.length < 2) {
      console.log("Invalid colors:", colors);
      return new Response(JSON.stringify({ error: "Need at least 2 colors" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const gameCode = generateGameCode();
    const now = new Date();

    const gameState = {
      grid: Array(64).fill(null),
      turn: 0,
      phase: "waiting",
    };

    const playersObj = colors.reduce((acc: any, color: string) => {
      acc[color] = false;
      return acc;
    }, {});

    try {
      await db.insert(Game).values({
        id: gameCode,
        state: gameState,
        currentPlayer: colors[0],
        players: playersObj,
        turnOrder: colors,
        createdAt: now,
        updatedAt: now,
      });
    } catch (dbError) {
      console.error("insert error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to create game" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        gameCode,
        gameId: gameCode,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Create game error:", error);
    return new Response(JSON.stringify({ error: "Failed to create game" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
