
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import "./Admin.css";
import Users from "./admin/pages/Users.jsx";
import Access from "./admin/pages/Access.jsx";

const sections = [
  { id: "overview", code: "SYS-00", label: "Resumen", icon: "◈" },
  { id: "users", code: "USR-01", label: "Personal / Usuarios", icon: "◎" },
  { id: "access", code: "ACL-02", label: "Control de acceso", icon: "▤" },
  { id: "modules", code: "MOD-03", label: "Módulos", icon: "▦" },
  { id: "audit", code: "LOG-04", label: "Registro de actividad", icon: "≋" },
  { id: "configuration", code: "CFG-05", label: "Configuración", icon: "⚙" },
];

const sectionContent = {
  users: {
    eyebrow: "PERSONNEL MANAGEMENT / USR-01",
    title: "Personal y usuarios",
    description: "Administración de las cuentas registradas en NEXORA.",
    message: "El módulo de gestión de usuarios está pendiente de conexión.",
  },
  access: {
    eyebrow: "ACCESS CONTROL / ACL-02",
    title: "Control de acceso",
    description: "Administración de roles, permisos y asignaciones.",
    message: "El módulo de roles y permisos está pendiente de conexión.",
  },
  modules: {
    eyebrow: "SYSTEM MODULES / MOD-03",
    title: "Módulos del sistema",
    description: "Supervisión de los módulos funcionales de NEXORA.",
    message: "El catálogo de módulos está pendiente de conexión.",
  },
  audit: {
    eyebrow: "SYSTEM RECORDS / LOG-04",
    title: "Registro de actividad",
    description: "Consulta de eventos y operaciones administrativas.",
    message: "El registro de auditoría está pendiente de conexión.",
  },
  configuration: {
    eyebrow: "SYSTEM CONFIGURATION / CFG-05",
    title: "Configuración",
    description: "Parámetros generales del entorno administrativo.",
    message: "La configuración administrativa está pendiente de conexión.",
  },
};

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
            <Overview
              user={user}
              onNavigate={selectSection}
            />
          ) : activeSection === "users" ? (
            <Users />
          ) : activeSection === "access" ? (
            <Access />
          ) : (
            <ModulePlaceholder
              section={currentSection}
              content={sectionContent[activeSection]}
            />
          )}

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
        </div>

        <span className="admin-section-code">LIVE MONITOR</span>
      </section>

      <div className="admin-metrics">
        <MetricCard
          code="USR-01"
          label="USUARIOS"
          value="—"
          detail="Datos pendientes de conexión"
          icon="◎"
        />

        <MetricCard
          code="ACL-02"
          label="ROLES"
          value="—"
          detail="Datos pendientes de conexión"
          icon="▤"
        />

        <MetricCard
          code="MOD-03"
          label="MÓDULOS"
          value="—"
          detail="Datos pendientes de conexión"
          icon="▦"
        />

        <MetricCard
          code="LOG-04"
          label="EVENTOS"
          value="—"
          detail="Datos pendientes de conexión"
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
              value="NO VERIFICADA"
              status="pending"
            />

            <DiagnosticRow
              label="Servicios administrativos"
              value="PENDIENTES"
              status="pending"
            />
          </div>

          <p className="admin-panel-note">
            Los estados pendientes requieren comprobación mediante servicios
            reales. No representan fallos confirmados.
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
            {sections.slice(1, 5).map((section) => (
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

          <span className="admin-panel-code">LOG / 03</span>
        </div>

        <div className="admin-empty-state">
          <span className="admin-empty-icon">≋</span>
          <strong>NO DATA AVAILABLE</strong>

          <p>
            El historial de actividad aparecerá aquí cuando conectemos el
            servicio de auditoría.
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

function ModulePlaceholder({ section, content }) {
  if (!content) return null;

  return (
    <section className="admin-module-page">
      <div className="admin-eyebrow">
        <span className="admin-status-light" />
        {content.eyebrow}
      </div>

      <div className="admin-module-title-row">
        <div>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>

        <span className="admin-module-code">{section?.code}</span>
      </div>

      <div className="admin-panel admin-module-placeholder">
        <div className="admin-placeholder-symbol">⌘</div>
        <span className="admin-eyebrow">MODULE INITIALIZATION</span>
        <h2>INTERFACE PENDING</h2>
        <p>{content.message}</p>

        <div className="admin-placeholder-status">
          <span className="admin-status-light pending" />
          AWAITING SERVICE INTEGRATION
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
