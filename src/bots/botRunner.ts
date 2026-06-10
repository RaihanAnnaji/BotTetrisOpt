import {
  APP_VERSION,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  TETROMINO_LIMIT,
  TIME_LIMIT_SECONDS,
} from "../config/experimentConfig";
import { TetrisEngine } from "../game/tetrisEngine";
import type { TetrisSnapshot } from "../game/tetrisEngine";
import type {
  ExperimentGroup,
  ExperimentResult,
  HeuristicWeights,
} from "../types/experiment";
import { findBestMove } from "./heuristicBot";
import type { BotMove } from "./heuristicBot";

export type RunBotTrialConfig = {
  group: Extract<ExperimentGroup, "heuristic" | "pso">;
  trial: number;
  seed: number;
  weights: HeuristicWeights;

  // Optional khusus untuk training PSO agar tidak terlalu berat.
  tetrominoLimit?: number;
  timeLimitSeconds?: number;
  speedLevel?: number;
};

const BOT_SIMULATED_SECONDS_PER_TETROMINO = 1;

export function runBotTrial(config: RunBotTrialConfig): ExperimentResult {
  const tetrominoLimit = config.tetrominoLimit ?? TETROMINO_LIMIT;
  const timeLimitSeconds = config.timeLimitSeconds ?? TIME_LIMIT_SECONDS;
  const speedLevel = config.speedLevel ?? 1;

  const engine = new TetrisEngine({
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    seed: config.seed,
    timeLimitSeconds,
    tetrominoLimit,
    speedLevel,
  });

  let snapshot = engine.getSnapshot();
  let safetyCounter = 0;

  // Safety biar tidak ada kemungkinan loop nyangkut.
  const maxSteps = tetrominoLimit + 20;

  while (!snapshot.isFinished && safetyCounter < maxSteps) {
    safetyCounter++;

    if (!snapshot.activePiece) {
      break;
    }

    const move = findBestMove(
      snapshot.board,
      snapshot.activePiece,
      config.weights
    );

    applyBotMoveToEngine(engine, move);

    snapshot = engine.getSnapshot();
  }

  return createBotResult({
    config,
    snapshot,
    tetrominoLimit,
    timeLimitSeconds,
    speedLevel,
  });
}

export function runBotBatch(params: {
  group: Extract<ExperimentGroup, "heuristic" | "pso">;
  trialStart: number;
  seedStart: number;
  count: number;
  weights: HeuristicWeights;
}) {
  const results: ExperimentResult[] = [];

  for (let index = 0; index < params.count; index++) {
    const trial = params.trialStart + index;
    const seed = params.seedStart + index;

    const result = runBotTrial({
      group: params.group,
      trial,
      seed,
      weights: params.weights,
    });

    results.push(result);
  }

  return results;
}

export function applyBotMoveToEngine(engine: TetrisEngine, move: BotMove) {
  for (let i = 0; i < move.rotationCount; i++) {
    const rotated = engine.rotate();

    if (!rotated) {
      break;
    }
  }

  let currentSnapshot = engine.getSnapshot();

  let moveGuard = 0;
  const maxMoveAttempts = 30;

  while (
    currentSnapshot.activePiece &&
    currentSnapshot.activePiece.x < move.targetX &&
    moveGuard < maxMoveAttempts
  ) {
    moveGuard++;

    const moved = engine.moveRight();

    if (!moved) {
      break;
    }

    currentSnapshot = engine.getSnapshot();
  }

  while (
    currentSnapshot.activePiece &&
    currentSnapshot.activePiece.x > move.targetX &&
    moveGuard < maxMoveAttempts
  ) {
    moveGuard++;

    const moved = engine.moveLeft();

    if (!moved) {
      break;
    }

    currentSnapshot = engine.getSnapshot();
  }

  engine.hardDrop();
}

function createBotResult(params: {
  config: RunBotTrialConfig;
  snapshot: TetrisSnapshot;
  tetrominoLimit: number;
  timeLimitSeconds: number;
  speedLevel: number;
}): ExperimentResult {
  const simulatedSurvivalTime = Math.min(
    params.timeLimitSeconds,
    params.snapshot.tetrominoCount * BOT_SIMULATED_SECONDS_PER_TETROMINO
  );

  return {
    timestamp: new Date().toISOString(),
    group: params.config.group,
    trial: params.config.trial,
    seed: params.config.seed,
    score: params.snapshot.score,
    lineClear: params.snapshot.lineClear,
    survivalTime: simulatedSurvivalTime,
    tetrominoCount: params.snapshot.tetrominoCount,
    endStatus: params.snapshot.endStatus ?? "game_over",
    boardWidth: BOARD_WIDTH,
    boardHeight: BOARD_HEIGHT,
    speedLevel: params.speedLevel,
    appVersion: APP_VERSION,
    heuristicWeights: params.config.weights,
  };
}