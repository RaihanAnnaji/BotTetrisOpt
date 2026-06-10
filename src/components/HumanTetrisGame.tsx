import { useEffect, useRef, useState } from "react";
import {
  APP_VERSION,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINO_LIMIT,
  TIME_LIMIT_SECONDS,
} from "../config/experimentConfig";
import { TETROMINO_COLORS } from "../game/tetromino";
import { TetrisEngine } from "../game/tetrisEngine";
import type { TetrisSnapshot } from "../game/tetrisEngine";
import type {
  ExperienceLevel,
  ExperimentResult,
} from "../types/experiment";

type HumanTetrisGameProps = {
  playerName: string;
  playerCode: string;
  experience: ExperienceLevel;
  trial: number;
  seed: number;
  onFinish: (result: ExperimentResult) => void;
};

type ControlAction = "left" | "right" | "down" | "rotate" | "drop";

const CELL_SIZE = 24;

export default function HumanTetrisGame({
  playerName,
  playerCode,
  experience,
  trial,
  seed,
  onFinish,
}: HumanTetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const hasFinishedRef = useRef(false);

  const [snapshot, setSnapshot] = useState<TetrisSnapshot | null>(null);

  useEffect(() => {
    const engine = new TetrisEngine({
      width: BOARD_WIDTH,
      height: BOARD_HEIGHT,
      seed,
      timeLimitSeconds: TIME_LIMIT_SECONDS,
      tetrominoLimit: TETROMINO_LIMIT,
      speedLevel: 1,
    });

    engineRef.current = engine;
    hasFinishedRef.current = false;

    const initialSnapshot = engine.getSnapshot();
    setSnapshot(initialSnapshot);
    drawGame(initialSnapshot);

    let animationFrameId = 0;
    let lastTime = performance.now();

    function loop(currentTime: number) {
      const engine = engineRef.current;
      if (!engine) return;

      const deltaSeconds = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      engine.update(deltaSeconds);

      const nextSnapshot = engine.getSnapshot();
      setSnapshot(nextSnapshot);
      drawGame(nextSnapshot);

      if (nextSnapshot.isFinished && !hasFinishedRef.current) {
        hasFinishedRef.current = true;

        onFinish({
          timestamp: new Date().toISOString(),
          group: "human",
          playerName,
          playerCode,
          experience,
          trial,
          seed,
          score: nextSnapshot.score,
          lineClear: nextSnapshot.lineClear,
          survivalTime: nextSnapshot.survivalTime,
          tetrominoCount: nextSnapshot.tetrominoCount,
          endStatus: nextSnapshot.endStatus ?? "game_over",
          boardWidth: BOARD_WIDTH,
          boardHeight: BOARD_HEIGHT,
          speedLevel: 1,
          appVersion: APP_VERSION,
        });

        return;
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      engineRef.current = null;
    };
  }, [experience, onFinish, playerCode, playerName, seed, trial]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const activeKeys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowDown",
        "ArrowUp",
        " ",
      ];

      if (activeKeys.includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === "ArrowLeft") {
        applyControlAction("left");
      }

      if (event.key === "ArrowRight") {
        applyControlAction("right");
      }

      if (event.key === "ArrowDown") {
        applyControlAction("down");
      }

      if (event.key === "ArrowUp") {
        applyControlAction("rotate");
      }

      if (event.key === " ") {
        applyControlAction("drop");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function applyControlAction(action: ControlAction) {
    const engine = engineRef.current;
    if (!engine) return;

    const currentSnapshot = engine.getSnapshot();

    if (currentSnapshot.isFinished) {
      return;
    }

    if (action === "left") {
      engine.moveLeft();
    }

    if (action === "right") {
      engine.moveRight();
    }

    if (action === "down") {
      engine.softDrop();
    }

    if (action === "rotate") {
      engine.rotate();
    }

    if (action === "drop") {
      engine.hardDrop();
    }

    const nextSnapshot = engine.getSnapshot();
    setSnapshot(nextSnapshot);
    drawGame(nextSnapshot);
  }

  function handleMobileControl(action: ControlAction) {
    applyControlAction(action);
  }

  function drawGame(currentSnapshot: TetrisSnapshot) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < currentSnapshot.renderBoard.length; y++) {
      for (let x = 0; x < currentSnapshot.renderBoard[y].length; x++) {
        const cell = currentSnapshot.renderBoard[y][x];

        if (cell) {
          ctx.fillStyle = TETROMINO_COLORS[cell];
          ctx.fillRect(
            x * CELL_SIZE + 1,
            y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
          );
        }

        ctx.strokeStyle = "#1e293b";
        ctx.strokeRect(
          x * CELL_SIZE,
          y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
  }

  return (
    <div className="game-area human-game-area">
      <div className="game-board-section">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={BOARD_WIDTH * CELL_SIZE}
            height={BOARD_HEIGHT * CELL_SIZE}
          />
        </div>

        <div className="mobile-controls">
          <p className="mobile-controls-title">Kontrol Mobile</p>

          <div className="mobile-control-grid">
            <button
              type="button"
              className="control-button rotate-button"
              onPointerDown={(event) => {
                event.preventDefault();
                handleMobileControl("rotate");
              }}
            >
              ROTATE
            </button>

            <button
              type="button"
              className="control-button"
              onPointerDown={(event) => {
                event.preventDefault();
                handleMobileControl("left");
              }}
            >
              ←
            </button>

            <button
              type="button"
              className="control-button"
              onPointerDown={(event) => {
                event.preventDefault();
                handleMobileControl("down");
              }}
            >
              ↓
            </button>

            <button
              type="button"
              className="control-button"
              onPointerDown={(event) => {
                event.preventDefault();
                handleMobileControl("right");
              }}
            >
              →
            </button>

            <button
              type="button"
              className="control-button drop-button"
              onPointerDown={(event) => {
                event.preventDefault();
                handleMobileControl("drop");
              }}
            >
              HARD DROP
            </button>
          </div>
        </div>
      </div>

      <div className="side-panel">
        <h2>Permainan Berjalan</h2>

        <p>
          Player: <strong>{playerCode}</strong>
        </p>
        <p>
          Trial: <strong>{trial}</strong>
        </p>
        <p>
          Seed: <strong>{seed}</strong>
        </p>

        <hr />

        <p>
          Skor: <strong>{snapshot?.score ?? 0}</strong>
        </p>
        <p>
          Line Clear: <strong>{snapshot?.lineClear ?? 0}</strong>
        </p>
        <p>
          Waktu: <strong>{snapshot?.survivalTime ?? 0}</strong> detik
        </p>
        <p>
          Tetromino: <strong>{snapshot?.tetrominoCount ?? 0}</strong> /{" "}
          {TETROMINO_LIMIT}
        </p>

        <hr />

        <h2>Kontrol Keyboard</h2>
        <p>← → : Geser kiri/kanan</p>
        <p>↓ : Turun cepat</p>
        <p>↑ : Rotasi</p>
        <p>Space : Hard drop</p>

        <hr />

        <p className="small-note">
          Untuk pengguna HP, gunakan tombol kontrol di bawah papan permainan.
          Mode landscape lebih disarankan agar tampilan lebih nyaman.
        </p>
      </div>
    </div>
  );
}
