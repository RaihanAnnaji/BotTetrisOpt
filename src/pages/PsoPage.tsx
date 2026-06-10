import { useCallback, useState } from "react";
import type { SyntheticEvent } from "react";
import BatchResultsCard from "../components/BatchResultsCard";
import BotTetrisGame from "../components/BotTetrisGame";
import PageLayout from "../components/PageLayout";
import ResultCard from "../components/ResultCard";
import { runBotBatch } from "../bots/botRunner";
import { trainPso } from "../bots/psoOptimizer";
import type { PsoTrainingResult } from "../bots/psoOptimizer";
import { DEFAULT_PSO_WEIGHTS } from "../config/experimentConfig";
import type {
  ExperimentResult,
  HeuristicWeights,
} from "../types/experiment";

export default function PsoPage() {
  const [trial, setTrial] = useState(1);
  const [seed, setSeed] = useState(1001);
  const [batchCount, setBatchCount] = useState(30);
  const [weights, setWeights] = useState<HeuristicWeights>(DEFAULT_PSO_WEIGHTS);

  const [particleCount, setParticleCount] = useState(10);
  const [iterations, setIterations] = useState(10);
  const [trainingSeedStart, setTrainingSeedStart] = useState(2001);
  const [trainingSeedCount, setTrainingSeedCount] = useState(3);
  const [trainingTetrominoLimit, setTrainingTetrominoLimit] = useState(50);
  const [psoRandomSeed, setPsoRandomSeed] = useState(777);
  const [inertiaWeight, setInertiaWeight] = useState(0.7);
  const [cognitiveCoefficient, setCognitiveCoefficient] = useState(1.5);
  const [socialCoefficient, setSocialCoefficient] = useState(1.5);

  const [isStarted, setIsStarted] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const [trainingStatus, setTrainingStatus] = useState("");
  const [trainingResult, setTrainingResult] =
    useState<PsoTrainingResult | null>(null);

  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [batchResults, setBatchResults] = useState<ExperimentResult[]>([]);

  function handleWeightChange(key: keyof HeuristicWeights, value: number) {
    setWeights((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleStart(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBatchResults([]);
    setResult(null);
    setIsStarted(true);
  }

  const handleFinish = useCallback((finalResult: ExperimentResult) => {
    setResult(finalResult);
    setIsStarted(false);
  }, []);

  async function handleTrainPso() {
    setIsTraining(true);
    setIsStarted(false);
    setResult(null);
    setBatchResults([]);
    setTrainingResult(null);
    setTrainingStatus("Training PSO dimulai...");

    try {
        const result = await trainPso(
    {
      particleCount,
      iterations,
      trainingSeedStart,
      trainingSeedCount,
      trainingTetrominoLimit,
      randomSeed: psoRandomSeed,
      inertiaWeight,
      cognitiveCoefficient,
      socialCoefficient,
    },
        (progress) => {
          setTrainingStatus(
            `Iterasi ${progress.iteration}/${progress.totalIterations} | Partikel ${progress.particle}/${progress.totalParticles} | Best fitness: ${progress.bestFitness.toFixed(2)}`
          );
        }
      );

      setWeights(result.bestWeights);
      setTrainingResult(result);
      setTrainingStatus(
        `Training selesai. Best fitness: ${result.bestFitness.toFixed(2)}`
      );
    } catch (error) {
      setTrainingStatus(`Training gagal: ${String(error)}`);
    } finally {
      setIsTraining(false);
    }
  }

  async function handleRunBatch() {
    setIsBatchRunning(true);
    setIsStarted(false);
    setResult(null);
    setBatchResults([]);

    await waitForUi();

    const results = runBotBatch({
      group: "pso",
      trialStart: 1,
      seedStart: seed,
      count: batchCount,
      weights,
    });

    setBatchResults(results);
    setIsBatchRunning(false);
  }

  return (
    <PageLayout
      title="Bot Heuristik + PSO"
      subtitle="Bot menggunakan bobot heuristik hasil optimasi PSO."
    >
      {!isStarted && (
        <form className="form" onSubmit={handleStart}>
          <h2>Konfigurasi Run Bot</h2>

          <label>
            Percobaan ke untuk Visual Run
            <input
              type="number"
              min={1}
              value={trial}
              onChange={(event) => setTrial(Number(event.target.value))}
            />
          </label>

          <label>
            Seed / Seed Awal Batch
            <input
              type="number"
              value={seed}
              onChange={(event) => setSeed(Number(event.target.value))}
            />
          </label>

          <label>
            Jumlah Percobaan Batch
            <input
              type="number"
              min={1}
              max={100}
              value={batchCount}
              onChange={(event) => setBatchCount(Number(event.target.value))}
            />
          </label>

          <h2>Konfigurasi Training PSO</h2>

          <div className="info-box">
            <p>
              Untuk test awal, gunakan nilai kecil dulu: 10 partikel, 10 iterasi,
              dan 5 seed training.
            </p>
            <p>
              Setelah aman, bisa dinaikkan misalnya 20 partikel, 30 iterasi,
              dan 10 seed training.
            </p>
          </div>

          <label>
            Jumlah Partikel
            <input
              type="number"
              min={1}
              max={100}
              value={particleCount}
              onChange={(event) => setParticleCount(Number(event.target.value))}
            />
          </label>

          <label>
            Jumlah Iterasi
            <input
              type="number"
              min={1}
              max={100}
              value={iterations}
              onChange={(event) => setIterations(Number(event.target.value))}
            />
          </label>

          <label>
            Seed Awal Training
            <input
              type="number"
              value={trainingSeedStart}
              onChange={(event) =>
                setTrainingSeedStart(Number(event.target.value))
              }
            />
          </label>

          <label>
            Jumlah Seed Training
            <input
              type="number"
              min={1}
              max={30}
              value={trainingSeedCount}
              onChange={(event) =>
                setTrainingSeedCount(Number(event.target.value))
              }
            />
          </label>

          <label>
            Batas Tetromino Training
            <input
              type="number"
              min={10}
              max={150}
              value={trainingTetrominoLimit}
              onChange={(event) =>
                setTrainingTetrominoLimit(Number(event.target.value))
              }
            />
          </label>

          <label>
            Random Seed PSO
            <input
              type="number"
              value={psoRandomSeed}
              onChange={(event) =>
                setPsoRandomSeed(Number(event.target.value))
              }
            />
          </label>

          <label>
            Inertia Weight
            <input
              type="number"
              step="0.1"
              value={inertiaWeight}
              onChange={(event) =>
                setInertiaWeight(Number(event.target.value))
              }
            />
          </label>

          <label>
            Cognitive Coefficient c1
            <input
              type="number"
              step="0.1"
              value={cognitiveCoefficient}
              onChange={(event) =>
                setCognitiveCoefficient(Number(event.target.value))
              }
            />
          </label>

          <label>
            Social Coefficient c2
            <input
              type="number"
              step="0.1"
              value={socialCoefficient}
              onChange={(event) =>
                setSocialCoefficient(Number(event.target.value))
              }
            />
          </label>

          <div className="button-row">
            <button
              type="button"
              onClick={handleTrainPso}
              disabled={isTraining}
            >
              {isTraining ? "Training PSO..." : "Latih Bobot dengan PSO"}
            </button>
          </div>

          {trainingStatus && (
            <p className="submit-message">
              {trainingStatus}
            </p>
          )}

          {trainingResult && (
            <div className="result-card">
              <h2>Hasil Training PSO</h2>

              <div className="result-grid">
                <span>Best Fitness</span>
                <strong>{trainingResult.bestFitness.toFixed(2)}</strong>

                <span>Seed Training</span>
                <strong>{trainingResult.trainingSeeds.join(", ")}</strong>

                <span>Iterasi</span>
                <strong>{trainingResult.history.length}</strong>

                <span>Aggregate Height</span>
                <strong>{trainingResult.bestWeights.aggregateHeight}</strong>

                <span>Complete Lines</span>
                <strong>{trainingResult.bestWeights.completeLines}</strong>

                <span>Holes</span>
                <strong>{trainingResult.bestWeights.holes}</strong>

                <span>Bumpiness</span>
                <strong>{trainingResult.bestWeights.bumpiness}</strong>

                <span>Max Height</span>
                <strong>{trainingResult.bestWeights.maxHeight}</strong>
              </div>
            </div>
          )}

          <h2>Bobot Bot PSO yang Digunakan</h2>

          <div className="info-box">
            <p>
              Nilai di bawah akan otomatis berubah setelah training PSO selesai.
              Kamu juga masih bisa edit manual kalau diperlukan.
            </p>
          </div>

          <label>
            Aggregate Height
            <input
              type="number"
              step="0.001"
              value={weights.aggregateHeight}
              onChange={(event) =>
                handleWeightChange("aggregateHeight", Number(event.target.value))
              }
            />
          </label>

          <label>
            Complete Lines
            <input
              type="number"
              step="0.001"
              value={weights.completeLines}
              onChange={(event) =>
                handleWeightChange("completeLines", Number(event.target.value))
              }
            />
          </label>

          <label>
            Holes
            <input
              type="number"
              step="0.001"
              value={weights.holes}
              onChange={(event) =>
                handleWeightChange("holes", Number(event.target.value))
              }
            />
          </label>

          <label>
            Bumpiness
            <input
              type="number"
              step="0.001"
              value={weights.bumpiness}
              onChange={(event) =>
                handleWeightChange("bumpiness", Number(event.target.value))
              }
            />
          </label>

          <label>
            Max Height
            <input
              type="number"
              step="0.001"
              value={weights.maxHeight}
              onChange={(event) =>
                handleWeightChange("maxHeight", Number(event.target.value))
              }
            />
          </label>

          <div className="button-row">
            <button type="submit">
              Jalankan 1 Trial Visual
            </button>

            <button
              type="button"
              onClick={handleRunBatch}
              disabled={isBatchRunning || isTraining}
            >
              {isBatchRunning ? "Menjalankan Batch..." : "Jalankan Batch"}
            </button>
          </div>
        </form>
      )}

      {isStarted && (
        <BotTetrisGame
          group="pso"
          trial={trial}
          seed={seed}
          weights={weights}
          onFinish={handleFinish}
        />
      )}

      {result && (
        <>
          <ResultCard result={result} />
          <button onClick={() => setResult(null)}>
            Jalankan Lagi
          </button>
        </>
      )}

      <BatchResultsCard
        title="Hasil Batch Bot Heuristik + PSO"
        results={batchResults}
      />
    </PageLayout>
  );
}

function waitForUi() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
}