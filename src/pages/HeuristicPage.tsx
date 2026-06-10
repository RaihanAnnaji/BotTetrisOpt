import { useCallback, useState } from "react";
import type { SyntheticEvent } from "react";
import BatchResultsCard from "../components/BatchResultsCard";
import BotTetrisGame from "../components/BotTetrisGame";
import PageLayout from "../components/PageLayout";
import ResultCard from "../components/ResultCard";
import { runBotBatch } from "../bots/botRunner";
import { DEFAULT_HEURISTIC_WEIGHTS } from "../config/experimentConfig";
import type {
  ExperimentResult,
  HeuristicWeights,
} from "../types/experiment";

export default function HeuristicPage() {
  const [trial, setTrial] = useState(1);
  const [seed, setSeed] = useState(1001);
  const [batchCount, setBatchCount] = useState(30);
  const [weights, setWeights] = useState<HeuristicWeights>(
    DEFAULT_HEURISTIC_WEIGHTS
  );

  const [isStarted, setIsStarted] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

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

  async function handleRunBatch() {
    setIsBatchRunning(true);
    setIsStarted(false);
    setResult(null);
    setBatchResults([]);

    await waitForUi();

    const results = runBotBatch({
      group: "heuristic",
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
      title="Bot Heuristik"
      subtitle="Bot baseline dengan bobot heuristik manual."
    >
      {!isStarted && (
        <form className="form" onSubmit={handleStart}>
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

          <h2>Bobot Heuristik</h2>

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
              disabled={isBatchRunning}
            >
              {isBatchRunning ? "Menjalankan Batch..." : "Jalankan Batch"}
            </button>
          </div>
        </form>
      )}

      {isStarted && (
        <BotTetrisGame
          group="heuristic"
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
        title="Hasil Batch Bot Heuristik"
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