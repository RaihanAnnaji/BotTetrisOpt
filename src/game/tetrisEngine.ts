import type { EndStatus } from "../types/experiment";
import {
  cloneMatrix,
  rotateMatrixClockwise,
  TetrominoRandomizer,
  TETROMINO_MATRICES,
} from "./tetromino";
import type { ActivePiece, PieceMatrix, TetrominoType } from "./tetromino";

export type Cell = TetrominoType | null;

export type TetrisEngineConfig = {
  width: number;
  height: number;
  seed: number;
  timeLimitSeconds: number;
  tetrominoLimit: number;
  speedLevel: number;
};

export type TetrisSnapshot = {
  board: Cell[][];
  renderBoard: Cell[][];
  activePiece: ActivePiece | null;

  score: number;
  lineClear: number;
  survivalTime: number;
  tetrominoCount: number;

  isFinished: boolean;
  endStatus: EndStatus | null;
};

const LINE_CLEAR_SCORE: Record<number, number> = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export class TetrisEngine {
  private width: number;
  private height: number;
  private randomizer: TetrominoRandomizer;

  private timeLimitSeconds: number;
  private tetrominoLimit: number;
  private speedLevel: number;

  private board: Cell[][];
  private activePiece: ActivePiece | null = null;

  private score = 0;
  private lineClear = 0;
  private survivalTime = 0;
  private tetrominoCount = 0;

  private dropTimer = 0;
  private dropInterval = 0.8;

  private isFinished = false;
  private endStatus: EndStatus | null = null;

  constructor(config: TetrisEngineConfig) {
    this.width = config.width;
    this.height = config.height;
    this.randomizer = new TetrominoRandomizer(config.seed);

    this.timeLimitSeconds = config.timeLimitSeconds;
    this.tetrominoLimit = config.tetrominoLimit;
    this.speedLevel = config.speedLevel;

    this.dropInterval = Math.max(0.1, 0.8 / this.speedLevel);
    this.board = this.createEmptyBoard();

    this.spawnPiece();
  }

  update(deltaSeconds: number) {
    if (this.isFinished) return;

    this.survivalTime += deltaSeconds;

    if (this.survivalTime >= this.timeLimitSeconds) {
      this.finish("time_limit");
      return;
    }

    this.dropTimer += deltaSeconds;

    while (this.dropTimer >= this.dropInterval && !this.isFinished) {
      this.dropTimer -= this.dropInterval;
      this.softDrop(false);
    }
  }

  moveLeft() {
    return this.move(-1, 0);
  }

  moveRight() {
    return this.move(1, 0);
  }

  softDrop(addScore = true) {
    if (!this.activePiece || this.isFinished) return;

    const moved = this.move(0, 1);

    if (moved) {
      if (addScore) {
        this.score += 1;
      }
      return;
    }

    this.lockPiece();
  }

  hardDrop() {
    if (!this.activePiece || this.isFinished) return;

    let distance = 0;

    while (this.move(0, 1)) {
      distance++;
    }

    this.score += distance * 2;
    this.lockPiece();
  }

  rotate() {
    if (!this.activePiece || this.isFinished) return false;

    const rotatedMatrix = rotateMatrixClockwise(this.activePiece.matrix);
    const kickOffsets = [0, -1, 1, -2, 2];

    for (const offsetX of kickOffsets) {
      const nextX = this.activePiece.x + offsetX;
      const nextY = this.activePiece.y;

      if (this.isValidPosition(nextX, nextY, rotatedMatrix)) {
        this.activePiece = {
          ...this.activePiece,
          x: nextX,
          matrix: rotatedMatrix,
        };
        return true;
      }
    }

    return false;
  }

  getSnapshot(): TetrisSnapshot {
    return {
      board: this.cloneBoard(this.board),
      renderBoard: this.getRenderBoard(),
      activePiece: this.activePiece
        ? {
            ...this.activePiece,
            matrix: cloneMatrix(this.activePiece.matrix),
          }
        : null,

      score: this.score,
      lineClear: this.lineClear,
      survivalTime: Math.floor(this.survivalTime),
      tetrominoCount: this.tetrominoCount,

      isFinished: this.isFinished,
      endStatus: this.endStatus,
    };
  }

  private createEmptyBoard(): Cell[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => null)
    );
  }

  private spawnPiece() {
    const type = this.randomizer.next();
    const matrix = cloneMatrix(TETROMINO_MATRICES[type]);

    const piece: ActivePiece = {
      type,
      matrix,
      x: Math.floor((this.width - matrix[0].length) / 2),
      y: 0,
    };

    if (!this.isValidPosition(piece.x, piece.y, piece.matrix)) {
      this.activePiece = null;
      this.finish("game_over");
      return;
    }

    this.activePiece = piece;
  }

  private move(dx: number, dy: number) {
    if (!this.activePiece || this.isFinished) return false;

    const nextX = this.activePiece.x + dx;
    const nextY = this.activePiece.y + dy;

    if (!this.isValidPosition(nextX, nextY, this.activePiece.matrix)) {
      return false;
    }

    this.activePiece = {
      ...this.activePiece,
      x: nextX,
      y: nextY,
    };

    return true;
  }

  private isValidPosition(x: number, y: number, matrix: PieceMatrix) {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 0) continue;

        const boardX = x + col;
        const boardY = y + row;

        if (boardX < 0 || boardX >= this.width) {
          return false;
        }

        if (boardY >= this.height) {
          return false;
        }

        if (boardY >= 0 && this.board[boardY][boardX] !== null) {
          return false;
        }
      }
    }

    return true;
  }

  private lockPiece() {
    if (!this.activePiece || this.isFinished) return;

    const { type, matrix, x, y } = this.activePiece;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 0) continue;

        const boardX = x + col;
        const boardY = y + row;

        if (boardY < 0) {
          this.finish("game_over");
          return;
        }

        this.board[boardY][boardX] = type;
      }
    }

    this.tetrominoCount++;

    const clearedLines = this.clearCompletedLines();

    this.lineClear += clearedLines;
    this.score += LINE_CLEAR_SCORE[clearedLines] * this.speedLevel;

    if (this.tetrominoCount >= this.tetrominoLimit) {
      this.finish("tetromino_limit");
      return;
    }

    this.spawnPiece();
  }

  private clearCompletedLines() {
    const remainingRows = this.board.filter((row) =>
      row.some((cell) => cell === null)
    );

    const clearedLineCount = this.height - remainingRows.length;

    const newRows = Array.from({ length: clearedLineCount }, () =>
      Array.from({ length: this.width }, () => null)
    );

    this.board = [...newRows, ...remainingRows];

    return clearedLineCount;
  }

  private getRenderBoard() {
    const renderBoard = this.cloneBoard(this.board);

    if (!this.activePiece) {
      return renderBoard;
    }

    const { type, matrix, x, y } = this.activePiece;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 0) continue;

        const boardX = x + col;
        const boardY = y + row;

        if (
          boardY >= 0 &&
          boardY < this.height &&
          boardX >= 0 &&
          boardX < this.width
        ) {
          renderBoard[boardY][boardX] = type;
        }
      }
    }

    return renderBoard;
  }

  private cloneBoard(board: Cell[][]) {
    return board.map((row) => [...row]);
  }

  private finish(status: EndStatus) {
    this.isFinished = true;
    this.endStatus = status;
  }
}