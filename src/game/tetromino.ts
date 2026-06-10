import { createSeededRandom } from "./random";

export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type PieceMatrix = number[][];

export type ActivePiece = {
  type: TetrominoType;
  matrix: PieceMatrix;
  x: number;
  y: number;
};

export const TETROMINO_TYPES: TetrominoType[] = [
  "I",
  "O",
  "T",
  "S",
  "Z",
  "J",
  "L",
];

export const TETROMINO_MATRICES: Record<TetrominoType, PieceMatrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: "#22d3ee",
  O: "#facc15",
  T: "#c084fc",
  S: "#4ade80",
  Z: "#f87171",
  J: "#60a5fa",
  L: "#fb923c",
};

export function cloneMatrix(matrix: PieceMatrix): PieceMatrix {
  return matrix.map((row) => [...row]);
}

export function rotateMatrixClockwise(matrix: PieceMatrix): PieceMatrix {
  const size = matrix.length;
  const rotated: PieceMatrix = [];

  for (let y = 0; y < size; y++) {
    const row: number[] = [];

    for (let x = 0; x < size; x++) {
      row.push(matrix[size - 1 - x][y]);
    }

    rotated.push(row);
  }

  return rotated;
}

export class TetrominoRandomizer {
  private random: () => number;
  private bag: TetrominoType[] = [];

  constructor(seed: number) {
    this.random = createSeededRandom(seed);
  }

  next(): TetrominoType {
    if (this.bag.length === 0) {
      this.bag = this.shuffle([...TETROMINO_TYPES]);
    }

    const nextPiece = this.bag.pop();

    if (!nextPiece) {
      throw new Error("Tetromino bag kosong.");
    }

    return nextPiece;
  }

  private shuffle(items: TetrominoType[]) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return items;
  }
}