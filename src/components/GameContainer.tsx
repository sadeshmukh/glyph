import ShapeDisplay from "./ShapeDisplay";

import { useState } from "react";
import GameLobby from "./server/GameLobby";
import GameUI from "./server/GameUI";

export default function GameContainer() {
  const [gameSession, setGameSession] = useState<{
    gameId: string;
    playerColor: string;
    playerId: string;
  } | null>(null);

  const handleJoinGame = (gameId: string, playerColor: string, playerId?: string) => {
    setGameSession({
      gameId,
      playerColor,
      playerId: playerId || `player-${playerColor}-${Date.now()}`
    });
  };

  if (gameSession) {
    return (
      <GameUI 
        gameId={gameSession.gameId}
        playerColor={gameSession.playerColor}
        playerId={gameSession.playerId}
      />
    );
  }

  return <GameLobby onJoinGame={handleJoinGame} />;
}