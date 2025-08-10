import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { useState, useEffect } from "react";
import Grid from "../Grid";
import PatternCard from "../PatternCard";

const BOARD_DIMS = { width: 8, height: 8 };
const PLAYER_COLORS = ["red", "green", "blue"];

const PATTERNS: boolean[][] = [
  [true, true, true, true, true, true, true, true, true],
  [true, false, true, false, true, false, true, false, true],
  [false, true, false, true, true, true, false, true, false],
  [true, true, true, false, false, false, false, false, false],
  [true, false, false, false, true, false, false, false, true],
];

function PlayerIndicator({
  color,
  onSubmit,
}: {
  color: string;
  onSubmit: () => void;
}) {
  const bgColor = `bg-${color}-500`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`w-16 h-16 rounded-full ${bgColor} border-4 border-white shadow-lg`}
      />
      <button
        onClick={onSubmit}
        className={`w-12 h-12 rounded-full ${bgColor} border-2 border-white hover:scale-110 transition-transform shadow-lg`}
      />
    </div>
  );
}

function PlayersDisplay({
  players,
  currentPlayer,
  myColor,
}: {
  players: Array<{ id: string; color: string; joinedAt: string }>;
  currentPlayer: string;
  myColor: string;
}) {
  const otherPlayers = players.filter((player) => player.color !== myColor);

  return (
    <div className="flex flex-col gap-3">
      {otherPlayers.map((player) => {
        const bgColor = `bg-${player.color}-500`;
        const isCurrentPlayer = player.color === currentPlayer;

        return (
          <div
            key={player.id}
            className={`w-12 h-12 rounded-full ${bgColor} border-2 ${
              isCurrentPlayer
                ? "border-white shadow-lg scale-110"
                : "border-gray-400 opacity-70"
            } transition-all`}
          />
        );
      })}
    </div>
  );
}

interface GameUIProps {
  gameId: string;
  playerColor: string;
  playerId: string;
}

export default function GameUI({ gameId, playerColor, playerId }: GameUIProps) {
  const [highlight, setHighlight] = useState<number[]>([]);
  const [gameState, setGameState] = useState<any>({
    grid: Array(64).fill(null),
    turn: 0,
    phase: "waiting",
    players: [],
  });
  const [isMyTurn, setIsMyTurn] = useState(false);
  const submitMove = async () => {
    try {
      const response = await fetch("/api/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          playerId,
          gameState,
        }),
      });

      if (response.ok) {
        setHighlight([]);
        setIsMyTurn(false);
      }
    } catch (error) {
      console.error("Failed to submit move:", error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventSource = new EventSource(
      `/api/game/events?gameId=${gameId}&playerId=${playerId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "gameUpdate") {
        setGameState((prevState) => ({
          ...data.gameState,
          currentPlayer: data.currentPlayer,
          grid: data.gameState.grid || prevState.grid,
        }));
        const canPlay =
          data.gameState.phase === "playing" &&
          data.currentPlayer === playerColor;
        setIsMyTurn(canPlay);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
    };

    return () => eventSource.close();
  }, [gameId, playerId, playerColor]);

  const computeHighlight = (anchorIndex: number, pattern: boolean[]) => {
    const indices: number[] = [];
    const anchorRow = Math.floor(anchorIndex / BOARD_DIMS.width);
    const anchorCol = anchorIndex % BOARD_DIMS.width;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const patternIdx = r * 3 + c;
        if (!pattern[patternIdx]) continue;
        const boardRow = anchorRow + r;
        const boardCol = anchorCol + c;
        if (boardRow >= BOARD_DIMS.height || boardCol >= BOARD_DIMS.width)
          continue;
        indices.push(boardRow * BOARD_DIMS.width + boardCol);
      }
    }
    return indices;
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!isMyTurn) return;

    const overId = event.over?.id as string | undefined;
    if (!overId || !overId.startsWith("cell-")) {
      setHighlight([]);
      return;
    }

    const activeId = event.active.id as string;
    const cellIndex = parseInt(overId.replace("cell-", ""));

    if (activeId.startsWith("add-") || activeId.startsWith("sub-")) {
      const cardIndex = parseInt(activeId.replace(/^(add|sub)-/, ""));
      const pattern = PATTERNS[cardIndex];
      setHighlight(computeHighlight(cellIndex, pattern));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isMyTurn) {
      setHighlight([]);
      return;
    }

    const overId = event.over?.id as string | undefined;
    const activeId = event.active.id as string;

    if (overId && overId.startsWith("cell-") && highlight.length > 0) {
      const isAdditive = activeId.startsWith("add-");
      applyPattern(highlight, isAdditive);
    }

    setHighlight([]);
  };

  const applyPattern = (indices: number[], isAdditive: boolean) => {
    const newGrid = [...gameState.grid];

    indices.forEach((index) => {
      if (isAdditive) {
        newGrid[index] = { color: playerColor, shape: "circle" };
      } else {
        newGrid[index] = null;
      }
    });

    setGameState({ ...gameState, grid: newGrid });
  };

  return (
    <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex flex-col items-center h-screen px-4 py-4">
        <div className="flex flex-col lg:flex-row flex-1 w-full max-w-6xl gap-6 items-center justify-center">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md aspect-square">
              <Grid
                dims={BOARD_DIMS}
                highlightIndices={highlight}
                initialItemData={gameState.grid}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <PlayerIndicator color={playerColor} onSubmit={submitMove} />
            {gameState.players && gameState.players.length > 1 && (
              <PlayersDisplay
                players={gameState.players}
                currentPlayer={gameState.currentPlayer}
                myColor={playerColor}
              />
            )}
          </div>
        </div>

        <div className="w-full max-w-6xl flex gap-8 justify-center py-4">
          <div className="flex gap-2">
            {PATTERNS.map((pattern, idx) => (
              <PatternCard
                id={`add-${idx}`}
                pattern={pattern}
                color={playerColor}
                key={`add-${idx}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {PATTERNS.map((pattern, idx) => (
              <PatternCard
                id={`sub-${idx}`}
                pattern={pattern}
                color="neutral"
                key={`sub-${idx}`}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
