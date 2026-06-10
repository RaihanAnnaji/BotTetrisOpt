import type { ExperimentResult } from "../types/experiment";

export type SubmitStatus = {
  ok: boolean;
  message: string;
};

export async function submitResultToSheet(
  result: ExperimentResult
): Promise<SubmitStatus> {
  const url = import.meta.env.VITE_APPS_SCRIPT_URL;
  const submitKey = import.meta.env.VITE_SUBMIT_KEY;

  if (!url) {
    return {
      ok: false,
      message: "VITE_APPS_SCRIPT_URL belum diisi.",
    };
  }

  const payload = {
    submitKey,
    ...result,
    userAgent: navigator.userAgent,
  };

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    return {
      ok: true,
      message:
        "Data dikirim ke Google Sheets. Karena mode no-cors, cek Sheet untuk memastikan data masuk.",
    };
  } catch (error) {
    return {
      ok: false,
      message: `Gagal mengirim data: ${String(error)}`,
    };
  }
}

export async function submitResultsToSheet(
  results: ExperimentResult[],
  onProgress?: (current: number, total: number) => void
): Promise<SubmitStatus> {
  for (let index = 0; index < results.length; index++) {
    await submitResultToSheet(results[index]);

    onProgress?.(index + 1, results.length);

    // Delay kecil supaya Apps Script tidak dihajar request terlalu cepat.
    await delay(150);
  }

  return {
    ok: true,
    message: `${results.length} data dikirim ke Google Sheets. Cek Sheet untuk memastikan semua baris masuk.`,
  };
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}