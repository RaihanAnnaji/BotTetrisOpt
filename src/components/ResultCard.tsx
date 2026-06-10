import { useState } from "react";
import type { ExperimentResult } from "../types/experiment";
import { exportSingleResultToCsv } from "../services/csvExport";
import { submitResultToSheet } from "../services/submitToSheet";

type ResultCardProps = {
  result: ExperimentResult;
};

export default function ResultCard({ result }: ResultCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  async function handleSubmitToSheet() {
    setIsSubmitting(true);
    setSubmitMessage("");

    const response = await submitResultToSheet(result);

    setSubmitMessage(response.message);
    setIsSubmitting(false);
  }

  return (
    <div className="result-card">
      <h2>Hasil Percobaan</h2>

      <div className="result-grid">
        <span>Kelompok</span>
        <strong>{result.group}</strong>

        <span>Trial</span>
        <strong>{result.trial}</strong>

        <span>Seed</span>
        <strong>{result.seed}</strong>

        <span>Skor</span>
        <strong>{result.score}</strong>

        <span>Line Clear</span>
        <strong>{result.lineClear}</strong>

        <span>Waktu Bertahan</span>
        <strong>{result.survivalTime} detik</strong>

        <span>Jumlah Tetromino</span>
        <strong>{result.tetrominoCount}</strong>

        <span>Status Akhir</span>
        <strong>{result.endStatus}</strong>
      </div>

      <div className="button-row">
        <button onClick={() => exportSingleResultToCsv(result)}>
          Download CSV
        </button>

        <button onClick={handleSubmitToSheet} disabled={isSubmitting}>
          {isSubmitting ? "Mengirim..." : "Submit ke Google Sheets"}
        </button>
      </div>

      {submitMessage && (
        <p className="submit-message">
          {submitMessage}
        </p>
      )}
    </div>
  );
}