import { useState } from "react";
import ShapeDisplay from "./ShapeDisplay";

interface GameLobbyProps {
  onJoinGame: (gameId: string, playerColor: string, playerId?: string) => void;
}

function ColorSelector({
  onColorSelect,
}: {
  onColorSelect: (colors: string[]) => void;
}) {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const COLORS = ["red", "green", "blue"];


  const toggleColor = (color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(newColors);
    onColorSelect(newColors);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4">
        {COLORS.map((color) => {
          const isSelected = selectedColors.includes(color);
          return (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`w-16 h-16 rounded-full border-4 transition-all duration-200 bg-${color}-500 ${
                isSelected
                  ? "border-white scale-110 shadow-lg"
                  : "border-neutral-600 scale-90 opacity-60"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function ShapeCodeInput({
  onCodeChange,
}: {
  onCodeChange: (code: string) => void;
}) {
  const [codeDigits, setCodeDigits] = useState<number[]>([3, 3, 3, 3, 3]); // 5-digit code starting with triangles

  const incrementShape = (index: number) => {
    const newDigits = [...codeDigits];
    newDigits[index] = newDigits[index] >= 8 ? 3 : newDigits[index] + 1;
    setCodeDigits(newDigits);
    onCodeChange(newDigits.join(""));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {codeDigits.map((sides, index) => (
          <ShapeDisplay
            key={index}
            sides={sides}
            color="bg-neutral-300"
            size="w-16 h-16"
            onClick={() => incrementShape(index)}
            className="border-2 border-neutral-600"
          />
        ))}
      </div>
    </div>
  );
}

function GameCodeDisplay({ code }: { code: string }) {
  const digits = code.split("").map((d) => parseInt(d));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3">
        {digits.map((sides, index) => (
          <ShapeDisplay
            key={index}
            sides={sides}
            color="bg-emerald-400"
            size="w-12 h-12"
            className="border-2 border-emerald-600"
          />
        ))}
      </div>
    </div>
  );
}

export default function GameLobby({ onJoinGame }: GameLobbyProps) {
  const [mode, setMode] = useState<"menu" | "generate" | "enter" | "created">(
    "menu"
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCode, setInputCode] = useState("33333");

  const generateGame = async () => {
    console.log(selectedColors);
    if (selectedColors.length < 2) {
      return;
    }

    try {
      const requestBody = { colors: selectedColors };
      console.log(requestBody);

      const response = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("res ", data);

      if (data.success) {
        setGeneratedCode(data.gameCode);
        setMode("created");
      }
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const joinCreatedGame = async () => {
    try {
      const response = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: generatedCode,
          preferredColor: selectedColors[0],
        }),
      });

      const data = await response.json();
      if (data.success) {
        onJoinGame(generatedCode, data.assignedColor, data.playerId);
      }
    } catch (error) {
      console.error("Failed to join created game:", error);
    }
  };

  const joinGame = async () => {
    if (!inputCode) return;

    try {
      const response = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: inputCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onJoinGame(inputCode, data.assignedColor, data.playerId);
      }
    } catch (error) {
      console.error("Failed to join game:", error);
    }
  };

  if (mode === "menu") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-12">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 rounded-full bg-red-500"></div>
          <ShapeDisplay sides={3} color="bg-green-500" size="w-16 h-16" />
          <ShapeDisplay sides={4} color="bg-blue-500" size="w-16 h-16" />
        </div>

        <div className="flex space-x-8">
          <button
            onClick={() => window.location.href = '/gamelocal'}
            className="w-20 h-20 flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-5xl">
              play_arrow
            </span>
          </button>

          <button
            disabled
            className="w-20 h-20 flex items-center justify-center rounded-lg bg-neutral-600 opacity-50 cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-white text-5xl">
              add
            </span>
          </button>

          <button
            disabled
            className="w-20 h-20 flex items-center justify-center rounded-lg bg-neutral-600 opacity-50 cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-white text-5xl">
              login
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "generate") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-8">
        <ColorSelector onColorSelect={setSelectedColors} />

        <div className="flex gap-4">
          <button
            onClick={() => setMode("menu")}
            className="w-16 h-16 flex items-center justify-center rounded-lg bg-neutral-600 hover:bg-neutral-500 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-3xl">
              arrow_back
            </span>
          </button>

          <button
            onClick={generateGame}
            disabled={selectedColors.length < 2}
            className="w-16 h-16 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-600 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-3xl">
              check
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "created") {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-8">
        <GameCodeDisplay code={generatedCode} />

        <div className="flex gap-4">
          <button
            onClick={() => setMode("menu")}
            className="w-16 h-16 flex items-center justify-center rounded-lg bg-neutral-600 hover:bg-neutral-500 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-3xl">
              arrow_back
            </span>
          </button>

          <button
            onClick={joinCreatedGame}
            className="w-16 h-16 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-3xl">
              play_arrow
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <ShapeCodeInput onCodeChange={setInputCode} />

      <div className="flex gap-4">
        <button
          onClick={() => setMode("menu")}
          className="w-16 h-16 flex items-center justify-center rounded-lg bg-neutral-600 hover:bg-neutral-500 transition-colors"
        >
          <span className="material-symbols-outlined text-white text-3xl">
            arrow_back
          </span>
        </button>

        <button
          onClick={joinGame}
          disabled={!inputCode}
          className="w-16 h-16 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-600 disabled:opacity-50 transition-colors"
        >
          <span className="material-symbols-outlined text-white text-3xl">
            check
          </span>
        </button>
      </div>
    </div>
  );
}
