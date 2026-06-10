import { createSeededRandom } from "../game/random";
import { runBotTrial } from "./botRunner";
import type { HeuristicWeights } from "../types/experiment";

const WEIGHT_KEYS = [
  "aggregateHeight",
  "completeLines",
  "holes",
  "bumpiness",
  "maxHeight",
] as const;

type WeightKey = (typeof WEIGHT_KEYS)[number];

type Particle = {
  position: number[];
  velocity: number[];
  bestPosition: number[];
  bestFitness: number;
};

export type PsoTrainingParams = {
  particleCount: number;
  iterations: number;
  trainingSeedStart: number;
  trainingSeedCount: number;
  trainingTetrominoLimit: number;
  randomSeed: number;
  inertiaWeight: number;
  cognitiveCoefficient: number;
  socialCoefficient: number;
};

export type PsoProgress = {
  iteration: number;
  totalIterations: number;
  particle: number;
  totalParticles: number;
  bestFitness: number;
  bestWeights: HeuristicWeights;
};

export type PsoIterationLog = {
  iteration: number;
  bestFitness: number;
  bestWeights: HeuristicWeights;
};

export type PsoTrainingResult = {
  bestWeights: HeuristicWeights;
  bestFitness: number;
  trainingSeeds: number[];
  history: PsoIterationLog[];
};

const WEIGHT_BOUNDS: Record<WeightKey, { min: number; max: number }> = {
  aggregateHeight: { min: -2, max: 0 },
  completeLines: { min: 0, max: 2 },
  holes: { min: -2, max: 0 },
  bumpiness: { min: -2, max: 0 },
  maxHeight: { min: -2, max: 0 },
};

export async function trainPso(
  params: PsoTrainingParams,
  onProgress?: (progress: PsoProgress) => void
): Promise<PsoTrainingResult> {
  const random = createSeededRandom(params.randomSeed);

  const particleCount = Math.max(1, Math.floor(params.particleCount));
  const iterations = Math.max(1, Math.floor(params.iterations));
  const trainingSeedCount = Math.max(1, Math.floor(params.trainingSeedCount));
  const trainingTetrominoLimit = Math.max(
    10,
    Math.floor(params.trainingTetrominoLimit)
  );

  const trainingSeeds = Array.from(
    { length: trainingSeedCount },
    (_, index) => params.trainingSeedStart + index
  );

  const particles = Array.from({ length: particleCount }, () =>
    createParticle(random)
  );

  let globalBestPosition = [...particles[0].position];
  let globalBestFitness = Number.NEGATIVE_INFINITY;

  const history: PsoIterationLog[] = [];

  for (let iteration = 1; iteration <= iterations; iteration++) {
    for (let particleIndex = 0; particleIndex < particles.length; particleIndex++) {
      const particle = particles[particleIndex];

      const weights = vectorToWeights(particle.position);

      const fitness = await evaluateWeights({
        weights,
        trainingSeeds,
        trainingTetrominoLimit,
      });

      if (fitness > particle.bestFitness) {
        particle.bestFitness = fitness;
        particle.bestPosition = [...particle.position];
      }

      if (fitness > globalBestFitness) {
        globalBestFitness = fitness;
        globalBestPosition = [...particle.position];
      }

      onProgress?.({
        iteration,
        totalIterations: iterations,
        particle: particleIndex + 1,
        totalParticles: particleCount,
        bestFitness: globalBestFitness,
        bestWeights: vectorToWeights(globalBestPosition),
      });

      // Ini penting agar browser tidak terlihat freeze.
      await yieldToBrowser();
    }

    const bestWeights = vectorToWeights(globalBestPosition);

    history.push({
      iteration,
      bestFitness: globalBestFitness,
      bestWeights,
    });

    updateParticles({
      particles,
      random,
      globalBestPosition,
      inertiaWeight: params.inertiaWeight,
      cognitiveCoefficient: params.cognitiveCoefficient,
      socialCoefficient: params.socialCoefficient,
    });

    await yieldToBrowser();
  }

  return {
    bestWeights: vectorToWeights(globalBestPosition),
    bestFitness: globalBestFitness,
    trainingSeeds,
    history,
  };
}

function createParticle(random: () => number): Particle {
  const position = WEIGHT_KEYS.map((key) => {
    const bound = WEIGHT_BOUNDS[key];
    return randomBetween(random, bound.min, bound.max);
  });

  const velocity = WEIGHT_KEYS.map((key) => {
    const bound = WEIGHT_BOUNDS[key];
    const range = bound.max - bound.min;

    return randomBetween(random, -range * 0.1, range * 0.1);
  });

  return {
    position,
    velocity,
    bestPosition: [...position],
    bestFitness: Number.NEGATIVE_INFINITY,
  };
}

function updateParticles(params: {
  particles: Particle[];
  random: () => number;
  globalBestPosition: number[];
  inertiaWeight: number;
  cognitiveCoefficient: number;
  socialCoefficient: number;
}) {
  for (const particle of params.particles) {
    for (let dimension = 0; dimension < particle.position.length; dimension++) {
      const r1 = params.random();
      const r2 = params.random();

      const cognitive =
        params.cognitiveCoefficient *
        r1 *
        (particle.bestPosition[dimension] - particle.position[dimension]);

      const social =
        params.socialCoefficient *
        r2 *
        (params.globalBestPosition[dimension] - particle.position[dimension]);

      const nextVelocity =
        params.inertiaWeight * particle.velocity[dimension] +
        cognitive +
        social;

      particle.velocity[dimension] = nextVelocity;
      particle.position[dimension] += nextVelocity;

      particle.position[dimension] = clampWeight(
        WEIGHT_KEYS[dimension],
        particle.position[dimension]
      );
    }
  }
}

async function evaluateWeights(params: {
  weights: HeuristicWeights;
  trainingSeeds: number[];
  trainingTetrominoLimit: number;
}) {
  let totalFitness = 0;

  for (let index = 0; index < params.trainingSeeds.length; index++) {
    const seed = params.trainingSeeds[index];

    const result = runBotTrial({
      group: "pso",
      trial: index + 1,
      seed,
      weights: params.weights,

      // Ini kunci biar training tidak berat.
      tetrominoLimit: params.trainingTetrominoLimit,
    });

    const fitness =
      result.score +
      result.lineClear * 100 +
      result.tetrominoCount * 5;

    totalFitness += fitness;

    await yieldToBrowser();
  }

  return totalFitness / params.trainingSeeds.length;
}

function vectorToWeights(vector: number[]): HeuristicWeights {
  return {
    aggregateHeight: roundWeight(vector[0]),
    completeLines: roundWeight(vector[1]),
    holes: roundWeight(vector[2]),
    bumpiness: roundWeight(vector[3]),
    maxHeight: roundWeight(vector[4]),
  };
}

function randomBetween(random: () => number, min: number, max: number) {
  return min + random() * (max - min);
}

function clampWeight(key: WeightKey, value: number) {
  const bound = WEIGHT_BOUNDS[key];

  return Math.min(bound.max, Math.max(bound.min, value));
}

function roundWeight(value: number) {
  return Number(value.toFixed(4));
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}