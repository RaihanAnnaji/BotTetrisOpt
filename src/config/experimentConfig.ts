import type { HeuristicWeights } from "../types/experiment";

export const APP_VERSION = "v0.1.0";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const TIME_LIMIT_SECONDS = 300;
export const TETROMINO_LIMIT = 150;

export const TRIAL_SEEDS: Record<number, number> = {
  1: 1001,
  2: 1002,
  3: 1003,
};

export const DEFAULT_HEURISTIC_WEIGHTS: HeuristicWeights = {
  aggregateHeight: -0.510,
  completeLines: 0.760,
  holes: -0.356,
  bumpiness: -0.184,
  maxHeight: -0.300,
};

export const DEFAULT_PSO_WEIGHTS: HeuristicWeights = {
  aggregateHeight: -0.720,
  completeLines: 0.910,
  holes: -0.480,
  bumpiness: -0.250,
  maxHeight: -0.350,
};