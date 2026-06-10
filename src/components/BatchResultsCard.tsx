import { useMemo, useState } from "react";
import type { ExperimentResult } from "../types/experiment";
import { exportResultsToCsv } from "../services/csvExport";
import { submitResultsToSheet } from "../services/submitToSheet";

type BatchResultsCardProps = {
  title: string;
  results: ExperimentResult[];
};

export default function BatchResultsCard({
  title,
  results,
}: BatchResultsCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const stats = useMemo(() => calculateStats(results), [results]);

  async function handleSubmitAll() {
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitProgress("Mulai mengirim data...");

    const response = await submitResultsToSheet(
      results,
      (current, total) => {
        setSubmitProgress(`Mengirim ${current} dari ${total} data...`);
      }
    );

    setSubmitMessage(response.message);
    setIsSubmitting(false);
  }

  function handleExportCsv() {
    const group = results[0]?.group ?? "batch";
    exportResultsToCsv(results, `tetris-${group}-batch-results.csv`);
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="result-card">
      <h2>{title}</h2>

      <div className="result-grid">
        <span>Jumlah Data</span>
        <strong>{results.length}</strong>

        <span>Rata-rata Skor</span>
        <strong>{stats.meanScore.toFixed(2)}</strong>

        <span>Skor Minimum</span>
        <strong>{stats.minScore}</strong>

        <span>Skor Maksimum</span>
        <strong>{stats.maxScore}</strong>

        <span>Standar Deviasi Skor</span>
        <strong>{stats.stdScore.toFixed(2)}</strong>

        <span>Rata-rata Line Clear</span>
        <strong>{stats.meanLineClear.toFixed(2)}</strong>
      </div>

      <div className="button-row">
        <button onClick={handleExportCsv}>
          Download CSV Batch
        </button>

        <button onClick={handleSubmitAll} disabled={isSubmitting}>
          {isSubmitting ? "Mengirim..." : "Submit Semua ke Google Sheets"}
        </button>
      </div>

      {submitProgress && (
        <p className="submit-message">{submitProgress}</p>
      )}

      {submitMessage && (
        <p className="submit-message">{submitMessage}</p>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Trial</th>
              <th>Seed</th>
              <th>Skor</th>
              <th>Line</th>
              <th>Waktu</th>
              <th>Tetromino</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {results.map((result) => (
              <tr key={`${result.group}-${result.trial}-${result.seed}`}>
                <td>{result.trial}</td>
                <td>{result.seed}</td>
                <td>{result.score}</td>
                <td>{result.lineClear}</td>
                <td>{result.survivalTime}</td>
                <td>{result.tetrominoCount}</td>
                <td>{result.endStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function calculateStats(results: ExperimentResult[]) {
  const scores = results.map((result) => result.score);
  const lineClears = results.map((result) => result.lineClear);

  const meanScore = mean(scores);
  const meanLineClear = mean(lineClears);

  return {
    meanScore,
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    stdScore: standardDeviation(scores, meanScore),
    meanLineClear,
  };
}

function mean(values: number[]) {
  if (values.length === 0) return 0;

  return values.reduce((total, current) => total + current, 0) / values.length;
}

function standardDeviation(values: number[], average: number) {
  if (values.length <= 1) return 0;

  const variance =
    values.reduce((total, current) => {
      return total + Math.pow(current - average, 2);
    }, 0) /
    (values.length - 1);

  return Math.sqrt(variance);
}