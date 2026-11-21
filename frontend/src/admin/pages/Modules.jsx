
import { useEffect, useState } from "react";
import {
  getModules,
  registerModule,
  updateModuleStatus,
} from "../services/adminService";

export default function Modules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    location: "",
  });

  async function loadModules() {
    try {
      setLoading(true);
      setError("");
      const result = await getModules();
      setModules(result.modules || []);
    } catch (err) {
      setError(err.message || "No se pudieron consultar los módulos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModules();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await registerModule(form);

      setForm({
        name: "",
        key: "",
        description: "",
        location: "",
      });

      setMessage("Módulo registrado correctamente.");
      await loadModules();
    } catch (err) {
      setError(err.message || "No se pudo registrar el módulo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(module) {
    try {
      setError("");
      setMessage("");

      await updateModuleStatus(module.key, !module.active);

      setMessage(
        `Módulo ${module.active ? "desactivado" : "activado"} correctamente.`
      );

      await loadModules();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el módulo.");
    }
  }

  return (
    <section className="admin-module-page">
      <div className="admin-eyebrow">
        <span className="admin-status-light" />
        SYSTEM MODULES / MOD-03
      </div>

      <div className="admin-module-title-row">
        <div>
          <h1>Módulos del sistema</h1>
          <p>Consulta, registra y controla los módulos de NEXORA.</p>
        </div>
        <span className="admin-module-code">MOD-03</span>
      </div>

      {error && (
        <div className="admin-users-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-module-message" role="status">
          {message}
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">MODULE REGISTRATION</span>
            <h3>Registrar módulo</h3>
          </div>
        </div>

        <form className="admin-module-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Ej. NoteAnalysis"
              required
            />
          </label>

          <label>
            Clave única
            <input
              type="text"
              value={form.key}
              onChange={(e) =>
                setForm({
                  ...form,
                  key: e.target.value.toLowerCase().replace(/\s+/g, ""),
                })
              }
              placeholder="Ej. noteanalysis"
              required
            />
          </label>

          <label>
            Descripción
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Descripción breve"
            />
          </label>

          <label>
            Ubicación de integración
            <input
              type="text"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
              placeholder="Ej. blank_sheet"
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Registrando..." : "Registrar módulo"}
          </button>
        </form>
      </section>

      <section className="admin-panel admin-module-list">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">REGISTERED MODULES</span>
            <h3>Módulos registrados ({modules.length})</h3>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadModules}
            disabled={loading}
          >
            {loading ? "Consultando..." : "Actualizar"}
          </button>
        </div>

        {loading ? (
          <p>Consultando módulos...</p>
        ) : modules.length === 0 ? (
          <p>No hay módulos registrados.</p>
        ) : (
          <div className="admin-module-items">
            {modules.map((module) => (
              <article className="admin-module-item" key={module.key}>
                <div>
                  <strong>{module.name}</strong>
                  <span>{module.key}</span>
                  <p>{module.description || "Sin descripción."}</p>
                </div>

                <div className="admin-module-actions">
                  <span className={module.active ? "is-active" : "is-inactive"}>
                    {module.active ? "ACTIVO" : "INACTIVO"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggle(module)}
                  >
                    {module.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
