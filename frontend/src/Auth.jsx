
import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Auth({ mode = "login" }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (loading) return;

    if (!email.trim() || !password) {
      setError("Completa tu correo electrónico y contraseña.");
      return;
    }

    if (!isLogin && !name.trim()) {
      setError("Escribe tu nombre para crear tu cuenta.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Introduce un correo electrónico válido.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? "http://localhost:3001/api/auth/login"
        : "http://localhost:3001/api/auth/register";

      const payload = isLogin
        ? {
          email: email.trim(),
          password,
        }
        : {
          name: name.trim(),
          email: email.trim(),
          password,
        };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Error del servidor: ${response.status}`
        );
      }

      // Actualizar el usuario y sus permisos desde la sesión.
      const authenticatedSession = await refreshUser();

      if (!authenticatedSession?.user) {
        throw new Error(
          "La autenticación respondió correctamente, pero no se pudo verificar la sesión."
        );
      }

      // Redirigir según los permisos efectivos.
      const isAdmin = authenticatedSession.permissions.some(
        (permission) => permission.key === "users.read"
      );

      console.log("SESIÓN:", authenticatedSession);
      console.log("¿ES ADMINISTRADOR?:", isAdmin);

      console.log("SESIÓN:", authenticatedSession);
      console.log(
        "PERMISO users.read:",
        authenticatedSession?.permissions?.some(
          (permission) => permission.key === "users.read"
        )
      );
      console.log("DESTINO:", isAdmin ? "/admin" : "/app");

      navigate(isAdmin ? "/admin" : "/app", {
        replace: true,
      });

    } catch (error) {
      console.error("Error de autenticación:", error);

      setError(
        error.message || "No se pudo conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <header className="auth-header">
        <Link to="/" className="auth-brand" aria-label="Volver al inicio de NEXORA">
          <span className="auth-brand-symbol">✳</span>
          <span>
            NEXORA<span className="auth-brand-dot">.</span>
          </span>
        </Link>

        <Link to="/" className="auth-back-link">
          <span>←</span> Volver al inicio
        </Link>
      </header>

      <section className="auth-layout">
        <aside className="auth-intro">
          <span className="auth-eyebrow">
            <span className="auth-status-dot" />
            TU SIGUIENTE CAPÍTULO COMIENZA AQUÍ
          </span>

          <h1>
            {isLogin ? (
              <>
                Qué bueno
                <br />
                <span>tenerte de vuelta.</span>
              </>
            ) : (
              <>
                Todo gran proyecto
                <br />
                <span>comienza con una idea.</span>
              </>
            )}
          </h1>

          <p>
            {isLogin
              ? "Vuelve a tu espacio, retoma tus ideas y continúa construyendo lo que importa."
              : "Crea tu espacio personal para organizar tus ideas, descubrir posibilidades y convertir tus objetivos en acciones."}
          </p>

          <div className="auth-manifesto">
            <span>✳</span>
            <div>
              <strong>Piensa con claridad.</strong>
              <small>Construye con intención.</small>
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="auth-card-label">
              {isLogin ? "TU ESPACIO TE ESPERA" : "COMIENZA TU CAMINO"}
            </span>

            <h2>{isLogin ? "Iniciar sesión" : "Crear una cuenta"}</h2>

            <p>
              {isLogin
                ? "Introduce tus datos para continuar."
                : "Completa tus datos para empezar."}
            </p>
          </div>

          <div className="auth-mode-switch">
            <Link
              to="/login"
              className={`auth-mode-option ${isLogin ? "active" : ""}`}
              aria-current={isLogin ? "page" : undefined}
            >
              Iniciar sesión
            </Link>

            <Link
              to="/register"
              className={`auth-mode-option ${!isLogin ? "active" : ""}`}
              aria-current={!isLogin ? "page" : undefined}
            >
              Registrarse
            </Link>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <label className="auth-field">
                <span>Nombre</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="¿Cómo te llamas?"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
            )}

            <label className="auth-field">
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span>Contraseña</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                />

                <button
                  type="button"
                  className="auth-show-password"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            {isLogin && (
              <div className="auth-form-extra">
                <span className="auth-security-note">
                  <span>◇</span> Acceso a tu espacio personal
                </span>
                <span className="auth-soon-label">
                  Recuperación próximamente
                </span>
              </div>
            )}

            {!isLogin && (
              <label className="auth-field">
                <span>Confirmar contraseña</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={8}
                />
              </label>
            )}

            {error && (
              <p className="auth-message" role="alert">
                <span>ⓘ</span> {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Procesando..."
                : isLogin
                  ? "Entrar a NEXORA"
                  : "Crear mi cuenta"}

              {!loading && <span>↗</span>}
            </button>
          </form>

          <p className="auth-switch-copy">
            {isLogin ? "¿Todavía no tienes cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <Link to={isLogin ? "/register" : "/login"}>
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </Link>
          </p>

          <div className="auth-card-footer">
            <span className="auth-footer-symbol">✳</span>
            <span>Un espacio para construir lo que importa.</span>
          </div>
        </section>
      </section>

      <footer className="auth-page-footer">
        <span>© {new Date().getFullYear()} NEXORA</span>
        <span>Ideas · Organización · Progreso</span>
      </footer>
    </main>
  );
}
