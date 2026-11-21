
import { useEffect, useState } from "react";
import {
  getConfiguration,
  updateConfiguration,
} from "../services/adminService.js";

function Configuration() {
  const [settings, setSettings] = useState({
    general: {
      systemName: "",
      systemDescription: "",
      maintenanceMode: false,
    },
    preferences: {
      defaultLanguage: "es",
      defaultTimezone: "America/Guayaquil",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadConfiguration();
  }, []);

  async function loadConfiguration() {
    try {
      setLoading(true);
      setError("");

      const data = await getConfiguration();

      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      setError(err.message || "No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(section, key, value) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));

    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await updateConfiguration(settings);

      if (data.settings) {
        setSettings(data.settings);
      }

      setMessage("Configuración actualizada correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-configuration">
        <p className="admin-config-loading">
          CARGANDO CONFIGURACIÓN DEL SISTEMA...
        </p>
      </section>
    );
  }

  return (
    <section className="admin-configuration">
      <header className="admin-section-header">
        <div>
          <span className="admin-eyebrow">
            SYSTEM CONFIGURATION / CFG-05
          </span>
          <h1>Configuración</h1>
          <p>Administra los parámetros generales de NEXORA.</p>
        </div>

        <span className="admin-module-code">CFG-05</span>
      </header>

      {error && (
        <div className="admin-config-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-config-message success">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section className="admin-panel admin-config-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">GENERAL PARAMETERS</span>
              <h3>Información del sistema</h3>
            </div>
            <span className="admin-panel-code">CFG / 01</span>
          </div>

          <div className="admin-config-fields">
            <label>
              Nombre del sistema
              <input
                type="text"
                maxLength={200}
                value={settings.general.systemName}
                onChange={(event) =>
                  updateField("general", "systemName", event.target.value)
                }
                required
              />
            </label>

            <label>
              Descripción
              <textarea
                rows={3}
                maxLength={200}
                value={settings.general.systemDescription}
                onChange={(event) =>
                  updateField(
                    "general",
                    "systemDescription",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="admin-config-toggle">
              <span>
                <strong>Modo mantenimiento</strong>
                <small>
                  Parámetro informativo. No bloquea el acceso al sistema.
                </small>
              </span>

              <input
                type="checkbox"
                checked={settings.general.maintenanceMode}
                onChange={(event) =>
                  updateField(
                    "general",
                    "maintenanceMode",
                    event.target.checked
                  )
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-panel admin-config-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-eyebrow">USER PREFERENCES</span>
              <h3>Preferencias predeterminadas</h3>
            </div>
            <span className="admin-panel-code">CFG / 02</span>
          </div>

          <div className="admin-config-fields">
            <label>
              Idioma predeterminado
              <select
                value={settings.preferences.defaultLanguage}
                onChange={(event) =>
                  updateField(
                    "preferences",
                    "defaultLanguage",
                    event.target.value
                  )
                }
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>

            <label>
              Zona horaria
              <select
                value={settings.preferences.defaultTimezone}
                onChange={(event) =>
                  updateField(
                    "preferences",
                    "defaultTimezone",
                    event.target.value
                  )
                }
              >
                <option value="America/Guayaquil">
                  América / Guayaquil
                </option>
                <option value="America/Bogota">
                  América / Bogotá
                </option>
                <option value="America/Mexico_City">
                  América / Ciudad de México
                </option>
                <option value="UTC">UTC</option>
              </select>
            </label>
          </div>
        </section>

        <div className="admin-config-actions">
          <button type="submit" disabled={saving}>
            {saving ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default Configuration;
