export type ExperimentGroup = "human" | "heuristic" | "pso";

export type ExperienceLevel = "tidak_pernah" | "jarang" | "sering";

export type EndStatus = "game_over" | "time_limit" | "tetromino_limit";

export type HeuristicWeights = {
  aggregateHeight: number;
  completeLines: number;
  holes: number;
  bumpiness: number;
  maxHeight: number;
};

export type ExperimentResult = {
  timestamp: string;
  group: ExperimentGroup;

  playerName?: string;
  playerCode?: string;
  experience?: ExperienceLevel;

  trial: number;
  seed: number;

  score: number;
  lineClear: number;
  survivalTime: number;
  tetrominoCount: number;
  endStatus: EndStatus;

  boardWidth: number;
  boardHeight: number;
  speedLevel: number;
  appVersion: string;

  heuristicWeights?: HeuristicWeights;
};