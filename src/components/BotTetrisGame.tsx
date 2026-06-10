import { useEffect, useRef, useState } from "react";
import {
  APP_VERSION,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINO_LIMIT,
  TIME_LIMIT_SECONDS,
} from "../config/experimentConfig";
import { findBestMove } from "../bots/heuristicBot";
import { applyBotMoveToEngine } from "../bots/botRunner";
import type { BotMove } from "../bots/heuristicBot";
import { TETROMINO_COLORS } from "../game/tetromino";
import { TetrisEngine } from "../game/tetrisEngine";
import type { TetrisSnapshot } from "../game/tetrisEngine";
import type {
  ExperimentResult,
  HeuristicWeights,
} from "../types/experiment";

type BotTetrisGameProps = {
  group: "heuristic" | "pso";
  trial: number;
  seed: number;
  weights: HeuristicWeights;
  onFinish: (result: ExperimentResult) => void;
};

const CELL_SIZE = 24;

export default function BotTetrisGame({
  group,
  trial,
  seed,
  weights,
  onFinish,
}: BotTetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const hasFinishedRef = useRef(false);
  const handledTetrominoCountRef = useRef(-1);

  const [snapshot, setSnapshot] = useState<TetrisSnapshot | null>(null);
  const [lastMove, setLastMove] = useState<BotMove | null>(null);

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
    handledTetrominoCountRef.current = -1;

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

      const beforeMoveSnapshot = engine.getSnapshot();

      if (
        beforeMoveSnapshot.activePiece &&
        !beforeMoveSnapshot.isFinished &&
        handledTetrominoCountRef.current !== beforeMoveSnapshot.tetrominoCount
      ) {
        handledTetrominoCountRef.current = beforeMoveSnapshot.tetrominoCount;

        const move = findBestMove(
          beforeMoveSnapshot.board,
          beforeMoveSnapshot.activePiece,
          weights
        );

        setLastMove(move);
        applyBotMoveToEngine(engine, move);
      }

      engine.update(deltaSeconds);

      const nextSnapshot = engine.getSnapshot();
      setSnapshot(nextSnapshot);
      drawGame(nextSnapshot);

      if (nextSnapshot.isFinished && !hasFinishedRef.current) {
        hasFinishedRef.current = true;

        onFinish({
          timestamp: new Date().toISOString(),
          group,
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
          heuristicWeights: weights,
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
  }, [group, onFinish, seed, trial, weights]);



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
    <div className="game-area">
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH * CELL_SIZE}
          height={BOARD_HEIGHT * CELL_SIZE}
        />
      </div>

      <div className="side-panel">
        <h2>Bot Berjalan</h2>

        <p>Mode: <strong>{group}</strong></p>
        <p>Trial: <strong>{trial}</strong></p>
        <p>Seed: <strong>{seed}</strong></p>

        <hr />

        <p>Skor: <strong>{snapshot?.score ?? 0}</strong></p>
        <p>Line Clear: <strong>{snapshot?.lineClear ?? 0}</strong></p>
        <p>Waktu: <strong>{snapshot?.survivalTime ?? 0}</strong> detik</p>
        <p>
          Tetromino:{" "}
          <strong>{snapshot?.tetrominoCount ?? 0}</strong> / {TETROMINO_LIMIT}
        </p>

        <hr />

        <h2>Gerakan Bot Terakhir</h2>
        <p>Rotasi: <strong>{lastMove?.rotationCount ?? 0}</strong></p>
        <p>Target X: <strong>{lastMove?.targetX ?? "-"}</strong></p>
        <p>Landing Y: <strong>{lastMove?.landingY ?? "-"}</strong></p>
        <p>Nilai Evaluasi: <strong>{lastMove?.score.toFixed(3) ?? "-"}</strong></p>
      </div>
    </div>
  );
}