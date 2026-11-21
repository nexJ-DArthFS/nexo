
import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../services/adminService";

const PAGE_SIZE = 20;

function formatDate(value) {
  if (!value) return "Fecha desconocida";

  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function formatAction(action = "") {
  return action
    .split(".")
    .map((part) => part.replaceAll("_", " "))
    .join(" / ");
}

function Audit() {
  const [records, setRecords] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");

  async function loadRecords() {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs({
        skip,
        limit: PAGE_SIZE,
      });

      setRecords(data.records || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la auditoría.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [skip]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesResult =
        resultFilter === "all" || record.result === resultFilter;

      const searchableText = [
        record.action,
        record.actorId,
        record.target?.type,
        record.target?.id,
        JSON.stringify(record.details || {}),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesResult && matchesSearch;
    });
  }, [records, search, resultFilter]);

  return (
    <section className="admin-audit">
      <div className="admin-section-header">
        <div>
          <span className="admin-eyebrow">
            SYSTEM RECORDS / LOG-04
          </span>
          <h1>Registro de actividad</h1>
          <p>Historial de operaciones administrativas de NEXORA.</p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={loadRecords}
          disabled={loading}
        >
          {loading ? "CARGANDO..." : "↻ ACTUALIZAR"}
        </button>
      </div>

      <div className="admin-audit-summary">
        <div>
          <span>REGISTROS RECUPERADOS</span>
          <strong>{records.length}</strong>
        </div>

        <div>
          <span>OPERACIONES EXITOSAS</span>
          <strong>
            {records.filter((record) => record.result === "success").length}
          </strong>
        </div>

        <div>
          <span>OPERACIONES FALLIDAS</span>
          <strong>
            {records.filter((record) => record.result === "failure").length}
          </strong>
        </div>
      </div>

      <div className="admin-audit-toolbar">
        <input
          type="search"
          placeholder="Buscar acción, usuario o recurso..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={resultFilter}
          onChange={(event) => setResultFilter(event.target.value)}
        >
          <option value="all">Todos los resultados</option>
          <option value="success">Exitosos</option>
          <option value="failure">Fallidos</option>
          <option value="denied">Denegados</option>
        </select>
      </div>

      {error && (
        <div className="admin-users-error">
          {error}
        </div>
      )}

      <div className="admin-users-table-wrapper">
        <table className="admin-users-table admin-audit-table">
          <thead>
            <tr>
              <th>FECHA</th>
              <th>ACTOR</th>
              <th>ACCIÓN</th>
              <th>RECURSO</th>
              <th>RESULTADO</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="admin-users-empty">
                  Cargando registros...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="5" className="admin-users-empty">
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record._id}>
                  <td>{formatDate(record.createdAt)}</td>

                  <td>
                    <code>{record.actorId || "Sistema"}</code>
                  </td>

                  <td>{formatAction(record.action)}</td>

                  <td>
                    {record.target?.type || "—"}
                    <small className="admin-audit-target">
                      {record.target?.id || ""}
                    </small>
                  </td>

                  <td>
                    <span
                      className={`admin-audit-result ${record.result}`}
                    >
                      {record.result || "unknown"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-users-pagination">
        <span>
          Página {Math.floor(skip / PAGE_SIZE) + 1}
          {" · "}
          {filteredRecords.length} registros visibles
        </span>

        <div>
          <button
            type="button"
            disabled={skip === 0 || loading}
            onClick={() => setSkip((current) =>
              Math.max(0, current - PAGE_SIZE)
            )}
          >
            ← Anterior
          </button>

          <button
            type="button"
            disabled={records.length < PAGE_SIZE || loading}
            onClick={() => setSkip((current) =>
              current + PAGE_SIZE
            )}
          >
            Siguiente →
          </button>
        </div>
      </div>
    </section>
  );
}

export default Audit;
