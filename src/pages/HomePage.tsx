import { Link } from "react-router";

export default function HomePage() {
  return (
    <main className="page">
      <section className="card home-card">
        <h1>Eksperimen Tetris</h1>
        <p className="subtitle">
          Perbandingan performa Pemain Manusia, Bot Heuristik, dan Bot Heuristik + PSO.
        </p>

        <div className="menu-grid">
          <Link to="/human" className="menu-button">
            <span>Pemain Manusia</span>
            <small>Isi data pemain, pilih trial, lalu mulai permainan.</small>
          </Link>

          <Link to="/heuristic" className="menu-button">
            <span>Bot Heuristik</span>
            <small>Jalankan bot baseline dengan bobot heuristik manual.</small>
          </Link>

          <Link to="/pso" className="menu-button">
            <span>Bot Heuristik + PSO</span>
            <small>Jalankan bot dengan bobot hasil optimasi PSO.</small>
          </Link>
        </div>
      </section>
    </main>
  );
}