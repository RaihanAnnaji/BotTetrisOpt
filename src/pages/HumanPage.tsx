import { useCallback, useMemo, useState } from "react";
import type { SyntheticEvent } from "react";
import HumanTetrisGame from "../components/HumanTetrisGame";
import PageLayout from "../components/PageLayout";
import ResultCard from "../components/ResultCard";
import {
  TETROMINO_LIMIT,
  TIME_LIMIT_SECONDS,
  TRIAL_SEEDS,
} from "../config/experimentConfig";
import type {
  ExperienceLevel,
  ExperimentResult,
} from "../types/experiment";

export default function HumanPage() {
  const [playerName, setPlayerName] = useState("");
  const [playerCode, setPlayerCode] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel>("jarang");
  const [trial, setTrial] = useState(1);
  const [isStarted, setIsStarted] = useState(false);
  const [result, setResult] = useState<ExperimentResult | null>(null);

  const seed = useMemo(() => TRIAL_SEEDS[trial] ?? 1001, [trial]);

  function handleStart(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsStarted(true);
    setResult(null);
  }

  const handleFinish = useCallback((finalResult: ExperimentResult) => {
    setResult(finalResult);
    setIsStarted(false);
  }, []);

  return (
    <PageLayout
      title="Pemain Manusia"
      subtitle="Isi data pemain terlebih dahulu. Permainan baru dimulai setelah tombol Start ditekan."
    >
      {!isStarted && !result && (
        <form className="form" onSubmit={handleStart}>
          <label>
            Nama Pemain
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Contoh: Andi"
              required
            />
          </label>

          <label>
            Kode Pemain
            <input
              value={playerCode}
              onChange={(event) => setPlayerCode(event.target.value)}
              placeholder="Contoh: P001"
              required
            />
          </label>

          <label>
            Pengalaman Bermain
            <select
              value={experience}
              onChange={(event) =>
                setExperience(event.target.value as ExperienceLevel)
              }
            >
              <option value="tidak_pernah">Tidak pernah</option>
              <option value="jarang">Jarang</option>
              <option value="sering">Sering</option>
            </select>
          </label>

          <label>
            Percobaan ke
            <select
              value={trial}
              onChange={(event) => setTrial(Number(event.target.value))}
            >
              <option value={1}>Percobaan 1</option>
              <option value={2}>Percobaan 2</option>
              <option value={3}>Percobaan 3</option>
            </select>
          </label>

          <div className="info-box">
  <p>
    Seed otomatis: <strong>{seed}</strong>
  </p>
  <p>
    Batas waktu: <strong>{TIME_LIMIT_SECONDS / 60} menit</strong>
  </p>
  <p>
    Batas tetromino: <strong>{TETROMINO_LIMIT}</strong>
  </p>
  <p>
    Permainan berakhir jika terjadi game over, waktu habis, atau batas
    tetromino tercapai.
  </p>
  <p>
    Pengguna laptop dapat memakai keyboard. Pengguna HP dapat memakai tombol
    kontrol mobile setelah game dimulai.
  </p>
</div>

          <button type="submit">Start Game</button>
        </form>
      )}

      {isStarted && (
        <HumanTetrisGame
          playerName={playerName}
          playerCode={playerCode}
          experience={experience}
          trial={trial}
          seed={seed}
          onFinish={handleFinish}
        />
      )}

      {result && (
        <>
          <ResultCard result={result} />
          <button onClick={() => setResult(null)}>
            Ulang / Isi Data Lagi
          </button>
        </>
      )}
    </PageLayout>
  );
}