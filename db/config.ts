import { defineDb, defineTable, column } from 'astro:db';

const Game = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    state: column.json(),
    currentPlayer: column.text(),
    players: column.json(),
    turnOrder: column.json(),
    createdAt: column.date(),
    updatedAt: column.date(),
  }
});

const Player = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    gameId: column.text({ references: () => Game.columns.id }),
    color: column.text(),
    joinedAt: column.date(),
    lastSeen: column.date(),
  }
});

export default defineDb({
  tables: { Game, Player },
});
