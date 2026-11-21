
import { useEffect, useMemo, useState } from "react";
import {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
} from "../services/adminService";
import { useAuth } from "../../AuthContext.jsx";

const PAGE_SIZE = 20;

const STATUS_LABELS = {
  pending: "Pendiente",
  active: "Activo",
  suspended: "Suspendido",
  disabled: "Deshabilitado",
};

function formatDate(value) {
  if (!value) return "Sin registro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function Users() {
  const { user: currentUser, hasPermission } = useAuth();

  const canEditUsers = hasPermission("users.update");
  const canManageStatus = hasPermission("users.manage_status");

  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: PAGE_SIZE,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // =========================================
  // ESTADOS DE EDICIÓN Y MODIFICACIÓN
  // =========================================

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // =========================================
  // CARGAR LISTADO DE USUARIOS
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const result = await listUsers({
          skip: pagination.skip,
          limit: PAGE_SIZE,
          status,
        });

        if (cancelled) return;

        setUsers(result.users || []);

        setPagination(
          result.pagination || {
            total: 0,
            skip: pagination.skip,
            limit: PAGE_SIZE,
          }
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "No se pudieron cargar los usuarios."
          );
          setUsers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [pagination.skip, status, refreshKey]);

  // =========================================
  // CONSULTAR PERFIL INDIVIDUAL
  // =========================================

  async function openUser(userId) {
    setSelectedUser(null);
    setDetailError("");
    setActionError("");
    setActionSuccess("");
    setEditingName(false);
    setDetailLoading(true);

    try {
      const user = await getUserById(userId);
      setSelectedUser(user);
    } catch (err) {
      console.error("Error al consultar usuario:", err);

      setDetailError(
        err.message || "No se pudo consultar el usuario."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeUser() {
    if (savingUser) return;

    setSelectedUser(null);
    setDetailError("");
    setActionError("");
    setActionSuccess("");
    setEditingName(false);
  }

  // =========================================
  // EDITAR NOMBRE DEL USUARIO
  // =========================================

  function startEditingName() {
    setNewName(selectedUser?.name || "");
    setEditingName(true);
    setActionError("");
    setActionSuccess("");
  }

  async function handleUpdateName(event) {
    event.preventDefault();

    if (!selectedUser || !canEditUsers || savingUser) return;

    const normalizedName = newName.trim();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      setActionError(
        "El nombre debe tener entre 2 y 80 caracteres."
      );
      return;
    }

    if (normalizedName === selectedUser.name) {
      setEditingName(false);
      return;
    }

    setSavingUser(true);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await updateUser(selectedUser._id, {
        name: normalizedName,
      });

      const updatedUser = result.user;

      if (updatedUser) {
        setSelectedUser(updatedUser);
      } else {
        const refreshedUser = await getUserById(selectedUser._id);
        setSelectedUser(refreshedUser);
      }

      setEditingName(false);
      setActionSuccess("Nombre actualizado correctamente.");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setActionError(
        err.message || "No se pudo actualizar el nombre."
      );
    } finally {
      setSavingUser(false);
    }
  }

  // =========================================
  // CAMBIAR ESTADO DE LA CUENTA
  // =========================================

  async function handleUpdateStatus(newStatus) {
    if (!selectedUser || !canManageStatus || savingUser) return;

    if (!STATUS_LABELS[newStatus]) return;

    if (
      String(currentUser?._id) === String(selectedUser._id)
    ) {
      setActionError(
        "No puedes modificar el estado de tu propia cuenta."
      );
      return;
    }

    if (newStatus === selectedUser.status) return;

    const confirmation = window.confirm(
      `¿Confirmas cambiar el estado de esta cuenta a "${STATUS_LABELS[newStatus]}"?`
    );

    if (!confirmation) return;

    setSavingUser(true);
    setActionError("");
    setActionSuccess("");

    try {
      const result = await updateUserStatus(
        selectedUser._id,
        newStatus
      );

      if (result.user) {
        setSelectedUser(result.user);
      } else {
        const refreshedUser = await getUserById(selectedUser._id);
        setSelectedUser(refreshedUser);
      }

      setActionSuccess(
        "Estado de cuenta actualizado correctamente."
      );

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setActionError(
        err.message || "No se pudo actualizar el estado."
      );

      // Recuperar el valor real del servidor si hubo un error.
      try {
        const refreshedUser = await getUserById(selectedUser._id);
        setSelectedUser(refreshedUser);
      } catch {
        // Se conserva el error original.
      }
    } finally {
      setSavingUser(false);
    }
  }

  // =========================================
  // BÚSQUEDA LOCAL
  // =========================================

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const name = user.name || "";
      const email = user.email || "";

      return (
        name.toLowerCase().includes(normalizedSearch) ||
        email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, search]);

  // =========================================
  // PAGINACIÓN
  // =========================================

  const currentPage =
    Math.floor(pagination.skip / PAGE_SIZE) + 1;

  const totalPages = Math.max(
    1,
    Math.ceil(pagination.total / PAGE_SIZE)
  );

  function changeStatus(value) {
    setStatus(value);
    setSearch("");

    setPagination((current) => ({
      ...current,
      skip: 0,
    }));
  }

  function previousPage() {
    setPagination((current) => ({
      ...current,
      skip: Math.max(0, current.skip - PAGE_SIZE),
    }));
  }

  function nextPage() {
    if (currentPage >= totalPages) return;

    setPagination((current) => ({
      ...current,
      skip: current.skip + PAGE_SIZE,
    }));
  }

  // =========================================
  // INTERFAZ
  // =========================================

  return (
    <section className="admin-users">
      <header className="admin-section-header">
        <div>
          <span className="admin-eyebrow">
            GESTIÓN DE IDENTIDADES
          </span>

          <h1>Personal / Usuarios</h1>

          <p>
            Consulta y supervisa las cuentas registradas en NEXORA.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          {loading ? "Consultando..." : "Actualizar"}
        </button>
      </header>

      {/* RESUMEN */}

      <div className="admin-users-summary">
        <div className="admin-users-summary-card">
          <span>USUARIOS REGISTRADOS</span>
          <strong>{pagination.total}</strong>
        </div>

        <div className="admin-users-summary-card">
          <span>RESULTADOS EN ESTA PÁGINA</span>
          <strong>{users.length}</strong>
        </div>
      </div>

      {/* BÚSQUEDA Y FILTROS */}

      <div className="admin-users-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar en esta página por nombre o correo..."
          aria-label="Buscar usuarios en esta página"
        />

        <select
          value={status}
          onChange={(event) => changeStatus(event.target.value)}
          aria-label="Filtrar usuarios por estado"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="disabled">Deshabilitados</option>
        </select>
      </div>

      {/* ERRORES */}

      {error && (
        <div className="admin-users-error" role="alert">
          <strong>Error de consulta</strong>
          <p>{error}</p>

          {error.includes("403") && (
            <p>
              Tu cuenta no tiene autorización para consultar usuarios.
            </p>
          )}
        </div>
      )}

      {/* TABLA */}

      <div className="admin-users-table-wrapper">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>USUARIO</th>
              <th>CORREO ELECTRÓNICO</th>
              <th>ESTADO</th>
              <th>FECHA DE REGISTRO</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="admin-users-empty">
                  Consultando base de datos...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="admin-users-empty">
                  No fue posible obtener los registros.
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="admin-users-empty">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="admin-user-row"
                  onClick={() => openUser(user._id)}
                  title="Consultar perfil del usuario"
                >
                  <td>{user.name || "Sin nombre"}</td>

                  <td>{user.email || "Sin correo"}</td>

                  <td>
                    <span
                      className={`admin-user-status status-${user.status || "unknown"}`}
                    >
                      {STATUS_LABELS[user.status] || "Desconocido"}
                    </span>
                  </td>

                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}

      <footer className="admin-users-pagination">
        <span>
          Página {currentPage} de {totalPages}
          {" · "}
          {pagination.total} registros
        </span>

        <div>
          <button
            type="button"
            onClick={previousPage}
            disabled={loading || pagination.skip === 0}
          >
            Anterior
          </button>

          <button
            type="button"
            onClick={nextPage}
            disabled={loading || currentPage >= totalPages}
          >
            Siguiente
          </button>
        </div>
      </footer>

      {/* FICHA INDIVIDUAL */}

      {(detailLoading || selectedUser || detailError) && (
        <div className="admin-user-modal-overlay">
          <div
            className="admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
          >
            <header className="admin-user-modal-header">
              <div>
                <span className="admin-eyebrow">
                  REGISTRO DE IDENTIDAD
                </span>

                <h2 id="admin-user-modal-title">
                  Perfil del usuario
                </h2>
              </div>

              <button
                type="button"
                onClick={closeUser}
                aria-label="Cerrar perfil"
                disabled={savingUser}
              >
                ×
              </button>
            </header>

            {detailLoading && (
              <p>Consultando información del usuario...</p>
            )}

            {detailError && (
              <div className="admin-users-error" role="alert">
                {detailError}
              </div>
            )}

            {selectedUser && (
              <div className="admin-user-profile">
                <div className="admin-user-avatar">
                  {(selectedUser.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <h3>{selectedUser.name || "Sin nombre"}</h3>

                <p>{selectedUser.email || "Sin correo"}</p>

                {/* MENSAJES DE OPERACIÓN */}

                {actionError && (
                  <div className="admin-users-error" role="alert">
                    {actionError}
                  </div>
                )}

                {actionSuccess && (
                  <p
                    className="admin-user-action-success"
                    role="status"
                  >
                    {actionSuccess}
                  </p>
                )}

                {/* EDICIÓN DEL NOMBRE */}

                {canEditUsers && (
                  <section className="admin-user-edit-section">
                    {!editingName ? (
                      <button
                        type="button"
                        onClick={startEditingName}
                        disabled={savingUser}
                      >
                        Editar nombre
                      </button>
                    ) : (
                      <form onSubmit={handleUpdateName}>
                        <label htmlFor="admin-user-new-name">
                          Nombre del usuario
                        </label>

                        <input
                          id="admin-user-new-name"
                          type="text"
                          value={newName}
                          onChange={(event) =>
                            setNewName(event.target.value)
                          }
                          minLength={2}
                          maxLength={80}
                          required
                          disabled={savingUser}
                        />

                        <button
                          type="submit"
                          disabled={savingUser}
                        >
                          {savingUser
                            ? "Guardando..."
                            : "Guardar cambios"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingName(false);
                            setActionError("");
                          }}
                          disabled={savingUser}
                        >
                          Cancelar
                        </button>
                      </form>
                    )}
                  </section>
                )}

                {/* GESTIÓN DEL ESTADO */}

                {canManageStatus && (
                  <section className="admin-user-edit-section">
                    <label htmlFor="admin-user-status">
                      Estado de la cuenta
                    </label>

                    <select
                      id="admin-user-status"
                      value={selectedUser.status || ""}
                      onChange={(event) =>
                        handleUpdateStatus(event.target.value)
                      }
                      disabled={
                        savingUser ||
                        String(currentUser?._id) ===
                          String(selectedUser._id)
                      }
                    >
                      <option value="pending">Pendiente</option>
                      <option value="active">Activo</option>
                      <option value="suspended">Suspendido</option>
                      <option value="disabled">Deshabilitado</option>
                    </select>

                    {String(currentUser?._id) ===
                      String(selectedUser._id) && (
                      <small>
                        No puedes cambiar el estado de tu propia cuenta.
                      </small>
                    )}
                  </section>
                )}

                {/* INFORMACIÓN DEL PERFIL */}

                <div className="admin-user-profile-data">
                  <div>
                    <span>IDENTIFICADOR</span>
                    <strong>{selectedUser._id}</strong>
                  </div>

                  <div>
                    <span>ESTADO DE CUENTA</span>
                    <strong>
                      {STATUS_LABELS[selectedUser.status] ||
                        "Desconocido"}
                    </strong>
                  </div>

                  <div>
                    <span>FECHA DE REGISTRO</span>
                    <strong>
                      {formatDate(selectedUser.createdAt)}
                    </strong>
                  </div>

                  <div>
                    <span>ÚLTIMA ACTUALIZACIÓN</span>
                    <strong>
                      {formatDate(selectedUser.updatedAt)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
