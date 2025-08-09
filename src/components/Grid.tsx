import { useDroppable } from "@dnd-kit/core";

interface ItemData {
  id: string;
  color: string;
  shape: string;
}


function renderShape(shape: string, color: string) {
  const bgColor = `bg-${color}-500`;
  
  switch (shape) {
    case "circle":
      return <div className={`w-8 h-8 rounded-full ${bgColor}`}></div>;
    case "square":
      return <div className={`w-8 h-8 ${bgColor}`}></div>;
    default:
      return <div className={`w-8 h-8 ${bgColor}`}></div>;
  }
}

function GridCell({ 
  index, 
  item, 
  highlighted, 
  handleItemClick 
}: {
  index: number;
  item: ItemData | null;
  highlighted: boolean;
  handleItemClick?: (item: ItemData) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `cell-${index}` });
  
  return (
    <div
      ref={setNodeRef}
      className={`aspect-square w-full rounded-lg border border-neutral-600 relative flex items-center justify-center ${
        highlighted ? "ring-2 ring-emerald-400" : ""
      } ${item ? "bg-neutral-800" : "bg-neutral-700"}`}
      onClick={() => item && handleItemClick?.(item)}
    >
      {item && renderShape(item.shape, item.color)}
    </div>
  );
}

export default function Grid({
  handleItemClick,
  initialItemData,
  dims,
  highlightIndices,
}: {
  handleItemClick?: (item: ItemData) => void;
  initialItemData?: ItemData[];
  dims: { width: number; height: number };
  highlightIndices?: number[];
}) {
  const itemData = initialItemData ?? [];

  const totalCells = dims.width * dims.height;

  return (
    <div
      className="grid gap-2 content-start"
      style={{ gridTemplateColumns: `repeat(${dims.width}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: totalCells }).map((_, index) => {
        const item = index < itemData.length ? itemData[index] : null;
        const highlighted = highlightIndices?.includes(index);

        return (
          <GridCell 
            key={index} 
            index={index} 
            item={item} 
            highlighted={highlighted || false}
            handleItemClick={handleItemClick}
          />
        );
      })}
    </div>
  );
}
