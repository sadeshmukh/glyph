import { DndContext } from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { useState } from "react";
import Grid from "./Grid";
import PatternCard from "./PatternCard";

const BOARD_DIMS = { width: 8, height: 8 };
const DEFAULT_COLORS = ["red", "green", "blue"];
const getGameColors = (): string[] => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const colors = params.get("colors");
    if (colors) {
      const colorArray = colors.split(",");
      if (colorArray.length >= 2) {
        return colorArray;
      }
    }
  }
  return DEFAULT_COLORS.slice(0, 2);
};

function mixColors(color1: string, color2: string): string {
  if (color1 === color2) return color1;

  const mixingRules: Record<string, Record<string, string>> = {
    red: { green: "yellow", blue: "purple" },
    green: { red: "yellow", blue: "cyan" },
    blue: { red: "purple", green: "cyan" },
  };

  return (
    mixingRules[color1]?.[color2] || mixingRules[color2]?.[color1] || color1
  );
}

const ALL_PATTERNS: boolean[][] = [
  [true, true, true, true, true, true, true, true, true],
  [true, false, true, false, true, false, true, false, true],
  [false, true, false, true, true, true, false, true, false],
  [true, true, true, false, false, false, false, false, false],
  [true, false, false, false, true, false, false, false, true],
  [true, true, false, true, true, false, false, false, false],
  [false, false, false, true, true, true, false, false, false],
  [true, false, false, false, true, false, false, false, false],
  [false, true, false, false, true, false, false, true, false],
  [true, true, true, false, false, false, true, true, true],
  [false, false, true, false, true, false, true, false, false],
  [true, false, true, false, false, false, true, false, true],
  [false, true, true, false, true, true, false, false, false],
  [true, true, false, false, true, false, false, true, true],
  [false, false, false, false, true, false, false, false, false],
];

function generateRandomPattern(): boolean[] {
  const pattern: boolean[] = Array(9).fill(false);
  const numFilled = Math.floor(Math.random() * 7) + 2;

  for (let i = 0; i < numFilled; i++) {
    let pos: number;
    do {
      pos = Math.floor(Math.random() * 9);
    } while (pattern[pos]);
    pattern[pos] = true;
  }

  return pattern;
}

function generateRandomGoalPattern(
  availableColors: string[] = DEFAULT_COLORS
): (string | null)[] {
  const pattern: (string | null)[] = Array(9).fill(null);
  const numFilled = Math.floor(Math.random() * 6) + 2;
  // mixed colors available in goal patterns
  const colors = [...availableColors, "yellow", "purple", "orange"].slice(0, 6);

  for (let i = 0; i < numFilled; i++) {
    let pos: number;
    do {
      pos = Math.floor(Math.random() * 9);
    } while (pattern[pos]);
    pattern[pos] = colors[Math.floor(Math.random() * colors.length)];
  }

  return pattern;
}

function getRandomPatterns(
  count: number
): Array<{ pattern: boolean[]; isAdditive: boolean; id: string }> {
  const patterns = [];
  for (let i = 0; i < count; i++) {
    const isAdditive = Math.random() > 0.4;
    let pattern;

    if (Math.random() < 0.7) {
      pattern = ALL_PATTERNS[Math.floor(Math.random() * ALL_PATTERNS.length)];
    } else {
      pattern = generateRandomPattern();
    }

    patterns.push({
      pattern,
      isAdditive,
      id: `pattern-${i}-${Date.now()}`,
    });
  }
  return patterns;
}

function PlayerIndicator({
  color,
  onSubmit,
}: {
  color: string;
  onSubmit: () => void;
}) {
  const bgColor = `bg-${color}-500`;
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const emojis = [
    { emoji: "😠", label: "angry" },
    { emoji: "😊", label: "happy" },
    { emoji: "😢", label: "sad" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`w-16 h-16 rounded-full ${bgColor} border-4 border-white shadow-lg`}
      />

      {/* Emoji reactions */}
      <div className="flex gap-2">
        {emojis.map(({ emoji, label }) => (
          <button
            key={label}
            onClick={() =>
              setSelectedEmoji(selectedEmoji === emoji ? null : emoji)
            }
            className={`text-2xl p-2 rounded-full transition-all hover:scale-125 ${
              selectedEmoji === emoji
                ? "bg-white bg-opacity-20 scale-110 shadow-lg"
                : "hover:bg-white hover:bg-opacity-10"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {selectedEmoji && (
        <div className="text-4xl animate-bounce">{selectedEmoji}</div>
      )}
    </div>
  );
}

function GoalPattern({ pattern }: { pattern: (string | null)[] }) {
  const getColorClass = (color: string | null) => {
    if (!color) return "bg-neutral-700";
    switch (color) {
      case "red":
        return "bg-red-500";
      case "green":
        return "bg-green-500";
      case "yellow":
        return "bg-yellow-500";
      default:
        return "bg-neutral-700";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-3 gap-1 w-16 h-16">
        {pattern.map((color, idx) => (
          <div
            key={idx}
            className={`aspect-square border border-neutral-600 ${getColorClass(
              color
            )}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LocalGame() {
  const [players] = useState<string[]>(() => getGameColors());
  const [gameGrid, setGameGrid] = useState<
    Array<{ color: string; shape: string } | null>
  >(Array(64).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [highlight, setHighlight] = useState<number[]>([]);
  const [availablePatterns, setAvailablePatterns] = useState<
    Array<{ pattern: boolean[]; isAdditive: boolean; id: string }>
  >(() => getRandomPatterns(5));
  const [goalPattern, setGoalPattern] = useState<(string | null)[]>(() =>
    generateRandomGoalPattern(players)
  );
  const [gameWon, setGameWon] = useState(false);

  const currentPlayerColor = players[currentPlayer];

  const computeHighlight = (
    anchorIndex: number,
    pattern: boolean[]
  ): number[] => {
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
    if (gameWon) {
      setHighlight([]);
      return;
    }

    const overId = event.over?.id as string | undefined;
    if (!overId || !overId.startsWith("cell-")) {
      setHighlight([]);
      return;
    }

    const activeId = event.active.id as string;
    const cellIndex = parseInt(overId.replace("cell-", ""));

    if (activeId.startsWith("pattern-")) {
      const cardIndex = parseInt(activeId.split("-")[1]);
      const patternData = availablePatterns[cardIndex];
      setHighlight(computeHighlight(cellIndex, patternData.pattern));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (gameWon) {
      setHighlight([]);
      return;
    }

    const overId = event.over?.id as string | undefined;
    const activeId = event.active.id as string;

    if (overId && overId.startsWith("cell-") && highlight.length > 0) {
      const cardIndex = parseInt(activeId.split("-")[1]);
      const patternData = availablePatterns[cardIndex];
      applyPattern(highlight, patternData.isAdditive);
    }

    setHighlight([]);
  };

  const checkGoalPattern = (
    grid: Array<{ color: string; shape: string } | null>
  ): boolean => {
    for (let gridRow = 0; gridRow <= BOARD_DIMS.height - 3; gridRow++) {
      for (let gridCol = 0; gridCol <= BOARD_DIMS.width - 3; gridCol++) {
        let foundMatch = true;

        for (let patternRow = 0; patternRow < 3; patternRow++) {
          for (let patternCol = 0; patternCol < 3; patternCol++) {
            const goalIndex = patternRow * 3 + patternCol;
            const expectedColor = goalPattern[goalIndex];

            const gridIndex =
              (gridRow + patternRow) * BOARD_DIMS.width +
              (gridCol + patternCol);
            const actualPiece = grid[gridIndex];

            if (expectedColor !== null) {
              if (!actualPiece || actualPiece.color !== expectedColor) {
                foundMatch = false;
                break;
              }
            }
          }
          if (!foundMatch) break;
        }

        if (foundMatch) {
          return true;
        }
      }
    }

    return false;
  };

  const applyPattern = (indices: number[], isAdditive: boolean): void => {
    const newGrid = [...gameGrid];

    indices.forEach((index) => {
      if (isAdditive) {
        const existingPiece = newGrid[index];
        if (existingPiece) {
          const mixedColor = mixColors(existingPiece.color, currentPlayerColor);
          newGrid[index] = { color: mixedColor, shape: "circle" };
        } else {
          newGrid[index] = { color: currentPlayerColor, shape: "circle" };
        }
      } else {
        newGrid[index] = null;
      }
    });

    setGameGrid(newGrid);

    if (checkGoalPattern(newGrid)) {
      setGameWon(true);
    }

    setCurrentPlayer((currentPlayer + 1) % players.length);
    setAvailablePatterns(getRandomPatterns(5));
  };

  const submitMove = () => {
    setHighlight([]);
  };

  return (
    <DndContext onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div
        className={`flex flex-col items-center h-screen px-4 py-4 transition-all duration-1000 relative ${
          gameWon ? "bg-green-600" : "bg-neutral-900"
        }`}
      >
        <div className="flex flex-col lg:flex-row flex-1 w-full max-w-6xl gap-6 items-center justify-center">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md aspect-square">
              <Grid
                dims={BOARD_DIMS}
                highlightIndices={highlight}
                initialItemData={gameGrid}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <PlayerIndicator color={currentPlayerColor} onSubmit={submitMove} />
            <GoalPattern pattern={goalPattern} />
          </div>
        </div>

        <div className="w-full max-w-6xl flex justify-center py-4">
          <div className="flex gap-2">
            {availablePatterns.map((patternData, idx) => (
              <PatternCard
                id={patternData.id}
                pattern={patternData.pattern}
                color={patternData.isAdditive ? currentPlayerColor : "neutral"}
                key={patternData.id}
                disabled={gameWon}
              />
            ))}
          </div>
        </div>

        {gameWon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-full p-8 flex flex-col items-center gap-4">
              <div className="text-8xl">🎉</div>
              <button
                onClick={() => window.location.reload()}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-white text-3xl">
                  refresh
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
