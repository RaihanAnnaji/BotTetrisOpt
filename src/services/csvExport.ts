import type { ExperimentResult } from "../types/experiment";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

const headers = [
  "timestamp",
  "group",
  "playerName",
  "playerCode",
  "experience",
  "trial",
  "seed",
  "score",
  "lineClear",
  "survivalTime",
  "tetrominoCount",
  "endStatus",
  "boardWidth",
  "boardHeight",
  "speedLevel",
  "appVersion",
  "aggregateHeight",
  "completeLines",
  "holes",
  "bumpiness",
  "maxHeight",
];

function resultToRow(result: ExperimentResult) {
  return [
    result.timestamp,
    result.group,
    result.playerName ?? "",
    result.playerCode ?? "",
    result.experience ?? "",
    result.trial,
    result.seed,
    result.score,
    result.lineClear,
    result.survivalTime,
    result.tetrominoCount,
    result.endStatus,
    result.boardWidth,
    result.boardHeight,
    result.speedLevel,
    result.appVersion,
    result.heuristicWeights?.aggregateHeight ?? "",
    result.heuristicWeights?.completeLines ?? "",
    result.heuristicWeights?.holes ?? "",
    result.heuristicWeights?.bumpiness ?? "",
    result.heuristicWeights?.maxHeight ?? "",
  ];
}

export function exportSingleResultToCsv(result: ExperimentResult) {
  exportResultsToCsv(
    [result],
    `tetris-result-${result.group}-${result.trial}-${result.seed}.csv`
  );
}

export function exportResultsToCsv(
  results: ExperimentResult[],
  fileName = "tetris-results.csv"
) {
  const csvRows = [
    headers.map(escapeCsv).join(","),
    ...results.map((result) =>
      resultToRow(result).map(escapeCsv).join(",")
    ),
  ];

  const csv = csvRows.join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}