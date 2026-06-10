import { useEffect, useRef } from "react";

type TetrisCanvasProps = {
  label: string;
};

export default function TetrisCanvas({ label }: TetrisCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = 24;
    const cols = 10;
    const rows = 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#374151";

    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, rows * cellSize);
      ctx.stroke();
    }

    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(cols * cellSize, y * cellSize);
      ctx.stroke();
    }

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "16px Arial";
    ctx.fillText(label, 20, 40);
    ctx.fillText("Canvas Tetris placeholder", 20, 68);
  }, [label]);

  return (
    <div className="canvas-wrapper">
      <canvas ref={canvasRef} width={240} height={480} />
    </div>
  );
}