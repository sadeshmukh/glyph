import { useDraggable } from "@dnd-kit/core";

interface PatternCardProps {
  id: string;
  pattern: boolean[];
  color?: string;
  disabled?: boolean;
}

export default function PatternCard({
  id,
  pattern,
  color = "green",
  disabled = false,
}: PatternCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.6 : disabled ? 0.3 : 1,
      }}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
      className={`grid grid-cols-3 gap-0.5 w-20 h-20 bg-neutral-900 rounded-lg border border-neutral-600 shrink-0 p-1 ${
        disabled ? "cursor-not-allowed" : "cursor-grab"
      }`}
    >
      {pattern.map((filled, idx) => (
        <div
          key={idx}
          className={`rounded-sm ${
            filled ? `bg-${color}-500` : "bg-neutral-800"
          }`}
        />
      ))}
    </div>
  );
}
