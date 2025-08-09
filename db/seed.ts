import { db, Game, Player } from 'astro:db';

export default async function seed() {
	const testGameId = 'test-game-123';
	const now = new Date();
	
	await db.insert(Game).values({
		id: testGameId,
		state: {
			grid: Array(64).fill(null),
			turn: 0,
			phase: 'waiting'
		},
		currentPlayer: 'red',
		players: { red: true },
		turnOrder: ['red', 'green', 'blue'],
		createdAt: now,
		updatedAt: now,
	});

	await db.insert(Player).values({
		id: 'player-red-1',
		gameId: testGameId,
		color: 'red',
		joinedAt: now,
		lastSeen: now,
	});
}
