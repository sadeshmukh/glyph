import { useState } from "react";

interface ItemData {
  id: string;
  color: string; // e.g. red - use tailwind variants later
  shape: string; // circle, triangle, square atm
}

const DEFAULT_INITIAL_ITEM_DATA: ItemData[] = [
  {
    id: "1",
    color: "red",
    shape: "circle",
  },
];

function renderShape(shape: string, color: string) {
  switch (shape) {
    case "circle":
      return <div className={`w-10 h-10 rounded-full bg-${color}-500`}></div>;
    case "triangle":
      return <div className={`w-10 h-10 bg-${color}-500`}></div>; // TODO: actually do
    case "square":
      return <div className={`w-10 h-10 bg-${color}-500`}></div>;
    default:
      return <div className={`w-10 h-10 bg-${color}-500`}></div>;
  }
}

export default function Grid({
  handleItemClick,
  initialItemData,
  dims,
  customBackgroundMode,
}: {
  handleItemClick: (item: ItemData) => void;
  initialItemData: ItemData[] | undefined;
  dims: {
    width: number;
    height: number;
  };
  customBackgroundMode?: (item: ItemData) => React.ReactNode;
}) {
  if (!initialItemData) {
    return null;
  }

  const [itemData, setItemData] = useState(initialItemData);

  return (
    <div
      className={`grid grid-cols-${dims.width} gap-2 content-start h-[75vh]`} // TODO: this is not scalable
    >
      {itemData.map((item) => (
        <div
          key={item.id}
          className={`aspect-square w-full rounded-lg ${
            customBackgroundMode?.(item) ||
            "bg-neutral-800 border border-neutral-700"
          }`}
          onClick={() => handleItemClick(item)}
        >
          {renderShape(item.shape, item.color)}
        </div>
      ))}
      {itemData.length < dims.width * dims.height &&
        Array.from({ length: dims.width * dims.height - itemData.length }).map(
          (_, index) => (
            <div
              key={index}
              className="aspect-square w-full rounded-lg bg-neutral-800 border border-neutral-700"
            ></div>
          )
        )}
    </div>
  );
}
