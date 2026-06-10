import { Link } from "react-router";

type PageLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <main className="page">
      <div className="topbar">
        <Link to="/" className="back-link">
          ← Kembali
        </Link>
      </div>

      <section className="card">
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </section>
    </main>
  );
}