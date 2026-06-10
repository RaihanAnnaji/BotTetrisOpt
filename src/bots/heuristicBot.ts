import type { Cell } from "../game/tetrisEngine";
import {
  cloneMatrix,
  rotateMatrixClockwise,
} from "../game/tetromino";
import type {
  ActivePiece,
  PieceMatrix,
  TetrominoType,
} from "../game/tetromino";
import type { HeuristicWeights } from "../types/experiment";

export type BoardFeatures = {
  aggregateHeight: number;
  completeLines: number;
  holes: number;
  bumpiness: number;
  maxHeight: number;
};

export type BotMove = {
  rotationCount: number;
  targetX: number;
  landingY: number;
  score: number;
  features: BoardFeatures;
};

type SimulatedMove = {
  board: Cell[][];
  clearedLines: number;
};

export function findBestMove(
  board: Cell[][],
  activePiece: ActivePiece,
  weights: HeuristicWeights
): BotMove {
  const rotations = getUniqueRotations(activePiece.matrix);

  let bestMove: BotMove | null = null;

  for (let rotationCount = 0; rotationCount < rotations.length; rotationCount++) {
    const matrix = rotations[rotationCount];

    for (let x = -matrix[0].length; x < board[0].length; x++) {
      if (!isValidPosition(board, x, activePiece.y, matrix)) {
        continue;
      }

      const landingY = getLandingY(board, x, activePiece.y, matrix);

      const simulated = simulatePlacePiece(
        board,
        activePiece.type,
        matrix,
        x,
        landingY
      );

      const features = analyzeBoard(simulated.board);
      features.completeLines = simulated.clearedLines;

      const score = evaluateBoard(features, weights);

      if (!bestMove || score > bestMove.score) {
        bestMove = {
          rotationCount,
          targetX: x,
          landingY,
          score,
          features,
        };
      }
    }
  }

  if (!bestMove) {
    return {
      rotationCount: 0,
      targetX: activePiece.x,
      landingY: activePiece.y,
      score: Number.NEGATIVE_INFINITY,
      features: analyzeBoard(board),
    };
  }

  return bestMove;
}

function getUniqueRotations(matrix: PieceMatrix): PieceMatrix[] {
  const rotations: PieceMatrix[] = [];
  const keys = new Set<string>();

  let current = cloneMatrix(matrix);

  for (let i = 0; i < 4; i++) {
    const key = matrixToKey(current);

    if (!keys.has(key)) {
      keys.add(key);
      rotations.push(cloneMatrix(current));
    }

    current = rotateMatrixClockwise(current);
  }

  return rotations;
}

function matrixToKey(matrix: PieceMatrix) {
  return matrix.map((row) => row.join("")).join("|");
}

function isValidPosition(
  board: Cell[][],
  x: number,
  y: number,
  matrix: PieceMatrix
) {
  const height = board.length;
  const width = board[0].length;

  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === 0) continue;

      const boardX = x + col;
      const boardY = y + row;

      if (boardX < 0 || boardX >= width) {
        return false;
      }

      if (boardY >= height) {
        return false;
      }

      if (boardY >= 0 && board[boardY][boardX] !== null) {
        return false;
      }
    }
  }

  return true;
}

function getLandingY(
  board: Cell[][],
  x: number,
  startY: number,
  matrix: PieceMatrix
) {
  let y = startY;

  while (isValidPosition(board, x, y + 1, matrix)) {
    y++;
  }

  return y;
}

function simulatePlacePiece(
  board: Cell[][],
  type: TetrominoType,
  matrix: PieceMatrix,
  x: number,
  y: number
): SimulatedMove {
  const nextBoard = board.map((row) => [...row]);

  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === 0) continue;

      const boardX = x + col;
      const boardY = y + row;

      if (
        boardY >= 0 &&
        boardY < nextBoard.length &&
        boardX >= 0 &&
        boardX < nextBoard[0].length
      ) {
        nextBoard[boardY][boardX] = type;
      }
    }
  }

  const { clearedBoard, clearedLines } = clearCompletedLines(nextBoard);

  return {
    board: clearedBoard,
    clearedLines,
  };
}

function clearCompletedLines(board: Cell[][]) {
  const width = board[0].length;
  const height = board.length;

  const remainingRows = board.filter((row) =>
    row.some((cell) => cell === null)
  );

  const clearedLines = height - remainingRows.length;

  const newRows: Cell[][] = Array.from({ length: clearedLines }, () =>
    Array.from({ length: width }, () => null)
  );

  return {
    clearedBoard: [...newRows, ...remainingRows],
    clearedLines,
  };
}

function analyzeBoard(board: Cell[][]): BoardFeatures {
  const height = board.length;
  const width = board[0].length;

  const columnHeights: number[] = [];
  let holes = 0;

  for (let x = 0; x < width; x++) {
    let blockFound = false;
    let columnHeight = 0;

    for (let y = 0; y < height; y++) {
      const cell = board[y][x];

      if (cell !== null) {
        if (!blockFound) {
          columnHeight = height - y;
        }

        blockFound = true;
      } else if (blockFound) {
        holes++;
      }
    }

    columnHeights.push(columnHeight);
  }

  const aggregateHeight = columnHeights.reduce(
    (total, current) => total + current,
    0
  );

  const maxHeight = Math.max(...columnHeights);

  let bumpiness = 0;

  for (let i = 0; i < columnHeights.length - 1; i++) {
    bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
  }

  return {
    aggregateHeight,
    completeLines: 0,
    holes,
    bumpiness,
    maxHeight,
  };
}

function evaluateBoard(features: BoardFeatures, weights: HeuristicWeights) {
  return (
    features.aggregateHeight * weights.aggregateHeight +
    features.completeLines * weights.completeLines +
    features.holes * weights.holes +
    features.bumpiness * weights.bumpiness +
    features.maxHeight * weights.maxHeight
  );
}