
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./Admin.css";

import Users from "./admin/pages/Users.jsx";
import Access from "./admin/pages/Access.jsx";
import Modules from "./admin/pages/Modules.jsx";
import Audit from "./admin/pages/Audit.jsx";
import Configuration from "./admin/pages/Configuration.jsx";

import {
  listUsers,
  getAccessCatalog,
  getModules,
  getAuditLogs,
} from "./admin/services/adminService.js";

const sections = [
  { id: "overview", code: "SYS-00", label: "Resumen", icon: "◈" },
  { id: "users", code: "USR-01", label: "Personal / Usuarios", icon: "◎" },
  { id: "access", code: "ACL-02", label: "Control de acceso", icon: "▤" },
  { id: "modules", code: "MOD-03", label: "Módulos", icon: "▦" },
  { id: "audit", code: "LOG-04", label: "Registro de actividad", icon: "≋" },
  { id: "configuration", code: "CFG-05", label: "Configuración", icon: "⚙" },
];

// Extrae una lista de diferentes formatos de respuesta de la API.
function extractArray(data, possibleKeys) {
  if (Array.isArray(data)) return data;

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.data?.[key])) return data.data[key];
  }

  return [];
}

// Busca un total informado por el backend.
function extractTotal(data, possibleKeys, fallback) {
  for (const key of possibleKeys) {
    const value = data?.[key] ?? data?.data?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentSection = sections.find(
    (section) => section.id === activeSection
  );

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }

  function selectSection(sectionId) {
    setActiveSection(sectionId);
    setSidebarOpen(false);
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-symbol">N</div>

          <div className="admin-brand-text">
            <strong>
              NEXORA<span>.</span>
            </strong>
            <small>ADMINISTRATION CORE</small>
          </div>
        </div>

        <div className="admin-sidebar-status">
          <span className="admin-status-light" />
          SYSTEM ONLINE
          <span className="admin-status-version">V.01</span>
        </div>

        <div className="admin-nav-label">CONTROL DIRECTORY</div>

        <nav className="admin-navigation" aria-label="Administración">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`admin-nav-item ${
                activeSection === section.id ? "active" : ""
              }`}
              onClick={() => selectSection(section.id)}
              aria-current={
                activeSection === section.id ? "page" : undefined
              }
            >
              <span className="admin-nav-icon">{section.icon}</span>

              <span className="admin-nav-copy">
                <span>{section.label}</span>
                <small>{section.code}</small>
              </span>

              {activeSection === section.id && (
                <span className="admin-nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-terminal-label">CURRENT OPERATOR</div>

          <div className="admin-operator">
            <div className="admin-operator-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>

            <div className="admin-operator-info">
              <strong>{user?.name || "Administrador"}</strong>
              <small>{user?.email || "Sesión activa"}</small>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <span>↗</span> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar navegación"
        />
      )}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Abrir navegación"
          >
            ☰
          </button>

          <div className="admin-breadcrumb">
            <span>NEXORA CORE</span>
            <span className="admin-breadcrumb-divider">/</span>
            <strong>{currentSection?.label || "Resumen"}</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-connection">
              <span className="admin-status-light" />
              CONNECTION ACTIVE
            </span>

            <span className="admin-topbar-code">NX-ADMIN / 01</span>
          </div>
        </header>

        <div className="admin-content">
          {activeSection === "overview" ? (
            <Overview user={user} onNavigate={selectSection} />
          ) : activeSection === "users" ? (
            <Users />
          ) : activeSection === "access" ? (
            <Access />
          ) : activeSection === "modules" ? (
            <Modules />
          ) : activeSection === "audit" ? (
            <Audit />
          ) : activeSection === "configuration" ? (
            <Configuration />
          ) : null}

          <footer className="admin-footer">
            <span>NEXORA ADMINISTRATION CORE</span>
            <span>INTERNAL SYSTEMS / AUTHORIZED ACCESS ONLY</span>
            <span>BUILD 01.00</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Overview({ user, onNavigate }) {
  const [metrics, setMetrics] = useState({
    users: "—",
    roles: "—",
    modules: "—",
    events: "—",
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        listUsers({ skip: 0, limit: 1 }),
        getAccessCatalog(),
        getModules(),
        getAuditLogs({ skip: 0, limit: 1 }),
      ]);

      const nextMetrics = {};

      // USR-01: usuarios
      if (results[0].status === "fulfilled") {
        const data = results[0].value;
        const users = extractArray(data, ["users", "items", "results"]);

        nextMetrics.users = extractTotal(
          data,
          ["total", "totalUsers", "count", "totalCount"],
          users.length
        );
      } else {
        nextMetrics.users = "!";
      }

      // ACL-02: roles
      if (results[1].status === "fulfilled") {
        const data = results[1].value;
        const roles = extractArray(data, ["roles", "items"]);

        nextMetrics.roles = extractTotal(
          data,
          ["totalRoles", "rolesCount"],
          roles.length
        );
      } else {
        nextMetrics.roles = "!";
      }

      // MOD-03: módulos activos
      if (results[2].status === "fulfilled") {
        const data = results[2].value;
        const modules = extractArray(data, ["modules", "items", "results"]);

        nextMetrics.modules = modules.filter(
          (module) => module.active === true
        ).length;
      } else {
        nextMetrics.modules = "!";
      }

      // LOG-04: eventos registrados
      if (results[3].status === "fulfilled") {
        const data = results[3].value;
        const logs = extractArray(data, ["logs", "events", "items", "results"]);

        nextMetrics.events = extractTotal(
          data,
          ["total", "totalLogs", "totalEvents", "count", "totalCount"],
          logs.length
        );
      } else {
        nextMetrics.events = "!";
      }

      setMetrics(nextMetrics);

      const hasErrors = results.some(
        (result) => result.status === "rejected"
      );

      setError(
        hasErrors
          ? "Algunos indicadores no pudieron actualizarse."
          : ""
      );

      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error al actualizar indicadores:", err);
      setError("No se pudieron actualizar los indicadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();

    const interval = setInterval(loadMetrics, 60000);

    return () => clearInterval(interval);
  }, [loadMetrics]);

  return (
    <>
      <section className="admin-welcome">
        <div className="admin-welcome-content">
          <div className="admin-eyebrow">
            <span className="admin-status-light" />
            CENTRAL CONTROL INTERFACE
          </div>

          <h1>
            SYSTEM
            <br />
            <span>OVERVIEW.</span>
          </h1>

          <p>
            Bienvenido al centro de administración,{" "}
            <strong>{user?.name || "Administrador"}</strong>.
            <br />
            Desde aquí puedes supervisar y gestionar NEXORA.
          </p>

          <div className="admin-welcome-meta">
            <span>ENVIRONMENT: PRODUCTION INTERFACE</span>
            <span>ACCESS: AUTHENTICATED</span>
          </div>
        </div>

        <div className="admin-visual">
          <div className="admin-orbit orbit-one" />
          <div className="admin-orbit orbit-two" />
          <div className="admin-orbit orbit-three" />

          <div className="admin-core">
            <span>N</span>
          </div>

          <div className="admin-visual-caption">
            <span>CORE</span>
            <strong>NX-01</strong>
          </div>
        </div>

        <div className="admin-welcome-corner">
          NEXORA / SYSTEMS DIVISION
        </div>
      </section>

      <section className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">SYSTEM MONITORING / 001</span>
          <h2>Estado del sistema</h2>
          {lastUpdate && (
            <small>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </small>
          )}
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={loadMetrics}
          disabled={loading}
        >
          {loading ? "ACTUALIZANDO..." : "↻ ACTUALIZAR"}
        </button>
      </section>

      {error && (
        <p className="admin-panel-note" role="status">
          {error}
        </p>
      )}

      <div className="admin-metrics">
        <MetricCard
          code="USR-01"
          label="USUARIOS"
          value={metrics.users}
          detail={metrics.users === "!" ? "Error de consulta" : "Usuarios registrados"}
          icon="◎"
        />

        <MetricCard
          code="ACL-02"
          label="ROLES"
          value={metrics.roles}
          detail={metrics.roles === "!" ? "Error de consulta" : "Roles registrados"}
          icon="▤"
        />

        <MetricCard
          code="MOD-03"
          label="MÓDULOS"
          value={metrics.modules}
          detail={metrics.modules === "!" ? "Error de consulta" : "Módulos activos"}
          icon="▦"
        />

        <MetricCard
          code="LOG-04"
          label="EVENTOS"
          value={metrics.events}
          detail={metrics.events === "!" ? "Error de consulta" : "Eventos registrados"}
          icon="≋"
        />
      </div>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-system-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">CORE DIAGNOSTICS</span>
              <h3>Diagnóstico general</h3>
            </div>

            <span className="admin-panel-code">SYS / 01</span>
          </div>

          <div className="admin-diagnostic-list">
            <DiagnosticRow
              label="Sesión administrativa"
              value="AUTENTICADA"
              status="online"
            />

            <DiagnosticRow
              label="Control de acceso"
              value="ACTIVO"
              status="online"
            />

            <DiagnosticRow
              label="Base de datos"
              value="CONSULTADA"
              status="online"
            />

            <DiagnosticRow
              label="Servicios administrativos"
              value={error ? "PARCIAL" : "CONECTADOS"}
              status={error ? "pending" : "online"}
            />
          </div>

          <p className="admin-panel-note">
            Los indicadores se consultan desde los servicios administrativos.
          </p>
        </section>

        <section className="admin-panel admin-shortcuts-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">QUICK ACCESS</span>
              <h3>Accesos directos</h3>
            </div>

            <span className="admin-panel-code">NAV / 02</span>
          </div>

          <div className="admin-shortcuts">
            {sections.slice(1).map((section) => (
              <button
                type="button"
                key={section.id}
                className="admin-shortcut"
                onClick={() => onNavigate(section.id)}
              >
                <span className="admin-shortcut-icon">
                  {section.icon}
                </span>

                <span>
                  <strong>{section.label}</strong>
                  <small>{section.code}</small>
                </span>

                <span className="admin-shortcut-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-panel admin-activity-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">SYSTEM EVENT MONITOR</span>
            <h3>Actividad reciente</h3>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => onNavigate("audit")}
          >
            VER AUDITORÍA ↗
          </button>
        </div>

        <div className="admin-empty-state">
          <span className="admin-empty-icon">≋</span>
          <strong>CONSULTAR REGISTROS</strong>

          <p>
            Accede al módulo LOG-04 para consultar el historial de actividad
            administrativa.
          </p>
        </div>
      </section>
    </>
  );
}

function MetricCard({ code, label, value, detail, icon }) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-top">
        <span>{code}</span>
        <span className="admin-metric-icon">{icon}</span>
      </div>

      <div className="admin-metric-label">{label}</div>
      <div className="admin-metric-value">{value}</div>
      <div className="admin-metric-detail">{detail}</div>
      <div className="admin-metric-line" />
    </article>
  );
}

function DiagnosticRow({ label, value, status }) {
  return (
    <div className="admin-diagnostic-row">
      <span className="admin-diagnostic-dot" data-status={status} />
      <span className="admin-diagnostic-label">{label}</span>
      <strong data-status={status}>{value}</strong>
    </div>
  );
}

export default AdminDashboard;
