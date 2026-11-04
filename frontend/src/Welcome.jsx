import { Link } from "react-router-dom";
import "./Welcome.css";

const features = [
  {
    icon: "✳",
    title: "Organiza tu vida",
    description: "Tareas, notas e ideas en un mismo espacio.",
  },
  {
    icon: "⌘",
    title: "Transforma tus ideas",
    description: "Convierte pensamientos en acciones y proyectos.",
  },
  {
    icon: "◈",
    title: "A tu manera",
    description: "Personaliza tu espacio y crea tu propio entorno.",
  },
  {
    icon: "⬡",
    title: "Tu espacio personal",
    description: "Construye un lugar para aprender, crear y avanzar.",
  },
];

export default function Welcome() {
  return (
    <main className="welcome-page">
      <div className="welcome-glow welcome-glow-one" />
      <div className="welcome-glow welcome-glow-two" />

      <header className="welcome-header">
        <Link to="/" className="welcome-brand" aria-label="NEXORA, inicio">
          <span className="welcome-brand-symbol">✳</span>
          <span>NEXORA<span className="brand-dot">.</span></span>
        </Link>

        <nav className="welcome-nav" aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <a href="#caracteristicas">Características</a>
          <a href="#filosofia">Nuestra visión</a>
        </nav>

        <div className="welcome-header-actions">
          <Link to="/login" className="welcome-login">
            Iniciar sesión
          </Link>
          <Link to="/register" className="welcome-button welcome-button-small">
            Comenzar <span>↗</span>
          </Link>
        </div>
      </header>

      <section className="welcome-hero" id="inicio">
        <div className="welcome-copy">
          <div className="welcome-eyebrow">
            <span className="eyebrow-dot" />
            IDEAS · ORGANIZACIÓN · PROGRESO
          </div>

          <h1>
            Un lugar para
            <br />
            <span>pensar mejor,</span>
            <br />
            construir más.
          </h1>

          <p className="welcome-description">
            NEXORA es tu espacio digital para organizar tus ideas,
            gestionar tus tareas y dar forma a tus proyectos.
            Todo comienza con claridad.
          </p>

          <div className="welcome-hero-actions">
            <Link to="/register" className="welcome-button">
              Explorar NEXORA <span>↗</span>
            </Link>
            <a href="#caracteristicas" className="welcome-secondary-button">
              Descubrir más <span>↓</span>
            </a>
          </div>

          <div className="welcome-note">
            <span className="welcome-note-line" />
            Un espacio para lo que quieres llegar a ser.
          </div>
        </div>

        <div className="welcome-visual" aria-label="Ilustración abstracta de NEXORA">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-orbit orbit-three" />

          <div className="visual-core">
            <span className="visual-core-symbol">✳</span>
          </div>

          <div className="visual-caption visual-caption-top">
            <span className="visual-caption-dot" />
            TU ESPACIO, TUS POSIBILIDADES
          </div>

          <div className="visual-floating-card floating-card-top">
            <span className="floating-icon">✧</span>
            <div>
              <strong>Ideas en movimiento</strong>
              <small>Piensa · Conecta · Crea</small>
            </div>
          </div>

          <div className="visual-floating-card floating-card-bottom">
            <span className="floating-icon">↗</span>
            <div>
              <strong>Un paso a la vez</strong>
              <small>Avanza con intención</small>
            </div>
          </div>

          <div className="visual-caption visual-caption-bottom">
            NEXORA / 001
          </div>
        </div>
      </section>

      <section
        className="welcome-features"
        id="caracteristicas"
        aria-label="Características de NEXORA"
      >
        <div className="welcome-section-heading">
          <span>UN ESPACIO, MUCHAS POSIBILIDADES</span>
          <p>Todo lo que necesitas para convertir intención en progreso.</p>
        </div>

        <div className="welcome-feature-grid">
          {features.map((feature, index) => (
            <article className="welcome-feature-card" key={feature.title}>
              <div className="feature-card-top">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">
                  0{index + 1}
                </span>
              </div>

              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="welcome-manifesto" id="filosofia">
        <span className="manifesto-symbol">✳</span>
        <div>
          <span className="manifesto-label">LA FILOSOFÍA NEXORA</span>
          <h2>
            Menos ruido.
            <span> Más intención.</span>
          </h2>
          <p>
            La tecnología debe ayudarte a pensar, crear y avanzar,
            no a distraerte de lo que realmente importa.
          </p>
        </div>
        <Link to="/register" className="manifesto-link">
          Empieza tu camino <span>→</span>
        </Link>
      </section>

      <footer className="welcome-footer">
        <Link to="/" className="welcome-footer-brand">✳ NEXORA</Link>
        <span>Un espacio para construir lo que importa.</span>
        <Link to="/login">Ya tengo una cuenta ↗</Link>
      </footer>
    </main>
  );
}