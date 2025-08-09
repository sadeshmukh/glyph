interface ShapeDisplayProps {
  sides: number;
  color?: string;
  size?: string;
  onClick?: () => void;
  className?: string;
}

export default function ShapeDisplay({ 
  sides, 
  color = "bg-neutral-400", 
  size = "w-12 h-12",
  onClick,
  className = ""
}: ShapeDisplayProps) {
  const getShapeStyle = (sides: number) => {
    switch (sides) {
      case 3:
        return {
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
        };
      case 4:
        return {};
      case 5:
        return {
          clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
        };
      case 6:
        return {
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
        };
      case 8:
        return {
          clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"
        };
      default:
        return {
          borderRadius: "50%"
        };
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${size} ${color} ${className} ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
      style={getShapeStyle(sides)}
    />
  );
}