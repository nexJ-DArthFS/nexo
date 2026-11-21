
import { useEffect, useMemo, useState } from "react";
import {
  getAccessCatalog,
  getUserAssignments,
  listUsers,
} from "../services/adminService";

// =========================================
// UTILIDADES
// =========================================

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha no válida";

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatScope(scope) {
  if (!scope) return "No especificado";

  if (typeof scope === "string") {
    return scope.replaceAll("_", " ");
  }

  if (typeof scope === "object") {
    const type = scope.type || scope.level || "personal";
    const target = scope.module || scope.resource || scope.id;

    return target
      ? `${type}: ${target}`
      : type;
  }

  return String(scope);
}

function getAssignmentStatus(assignment) {
  if (assignment.effective) {
    return {
      label: "Efectiva",
      className: "effective",
    };
  }

  if (assignment.expired) {
    return {
      label: "Vencida",
      className: "expired",
    };
  }

  if (!assignment.active) {
    return {
      label: "Inactiva",
      className: "inactive",
    };
  }

  if (!assignment.scopeAllowed) {
    return {
      label: "Alcance inválido",
      className: "invalid",
    };
  }

  if (!assignment.role) {
    return {
      label: "Rol no disponible",
      className: "invalid",
    };
  }

  if (assignment.role.active === false) {
    return {
      label: "Rol inactivo",
      className: "inactive",
    };
  }

  return {
    label: "No efectiva",
    className: "inactive",
  };
}

// =========================================
// COMPONENTE PRINCIPAL
// =========================================

export default function Access() {
  const [catalog, setCatalog] = useState({
    roles: [],
    permissions: [],
    rolePermissions: [],
  });

  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userAssignments, setUserAssignments] = useState(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [assignmentsError, setAssignmentsError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // =========================================
  // CARGAR CATÁLOGO
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError("");

      try {
        const result = await getAccessCatalog();

        if (cancelled) return;

        setCatalog({
          roles: result.roles || [],
          permissions: result.permissions || [],
          rolePermissions: result.rolePermissions || [],
        });
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "No se pudo cargar el catálogo.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // =========================================
  // CARGAR USUARIOS
  // =========================================

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setUsersLoading(true);
      setUsersError("");

      try {
        const result = await listUsers({
          skip: 0,
          limit: 100,
        });

        if (cancelled) return;

        const receivedUsers = result.users || [];

        setUsers(receivedUsers);

        if (
          selectedUserId &&
          !receivedUsers.some(
            (user) => String(user._id || user.id) === selectedUserId
          )
        ) {
          setSelectedUserId("");
          setUserAssignments(null);
        }
      } catch (err) {
        if (!cancelled) {
          setUsersError(
            err.message || "No se pudieron consultar los usuarios."
          );
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // =========================================
  // BUSCAR USUARIOS
  // =========================================

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const name = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();

      return (
        name.includes(normalizedSearch) ||
        email.includes(normalizedSearch)
      );
    });
  }, [users, search]);

  // =========================================
  // CONSULTAR ASIGNACIONES
  // =========================================

  async function handleSelectUser(userId) {
    setSelectedUserId(userId);
    setUserAssignments(null);
    setAssignmentsError("");

    if (!userId) return;

    setAssignmentsLoading(true);

    try {
      const result = await getUserAssignments(userId);
      setUserAssignments(result);
    } catch (err) {
      setAssignmentsError(
        err.message || "No se pudieron consultar las asignaciones."
      );
    } finally {
      setAssignmentsLoading(false);
    }
  }

  // =========================================
  // PROCESAR MATRIZ RBAC
  // =========================================

  const permissionsByRole = useMemo(() => {
    const result = new Map();

    for (const role of catalog.roles) {
      result.set(String(role._id), []);
    }

    for (const relation of catalog.rolePermissions) {
      const permissions = result.get(String(relation.roleId));

      if (permissions) {
        permissions.push(String(relation.permissionId));
      }
    }

    return result;
  }, [catalog]);

  const relationSet = useMemo(() => {
    return new Set(
      catalog.rolePermissions.map(
        (relation) =>
          `${relation.roleId}:${relation.permissionId}`
      )
    );
  }, [catalog.rolePermissions]);

  const permissionsByModule = useMemo(() => {
    const groups = new Map();

    for (const permission of catalog.permissions) {
      const moduleName = permission.module || "other";

      if (!groups.has(moduleName)) {
        groups.set(moduleName, []);
      }

      groups.get(moduleName).push(permission);
    }

    return groups;
  }, [catalog.permissions]);

  const selectedUser = userAssignments?.user || null;
  const assignments = userAssignments?.assignments || [];

  const effectiveCount = assignments.filter(
    (assignment) => assignment.effective
  ).length;

  // =========================================
  // INTERFAZ
  // =========================================

  return (
    <section className="admin-access">

      {/* ENCABEZADO */}

      <header className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">
            ACCESS CONTROL / ACL-02
          </span>

          <h2>Control de acceso</h2>

          <p>
            Consulta los roles, permisos y relaciones de autorización
            configurados en NEXORA.
          </p>
        </div>

        <button
          type="button"
          className="admin-refresh-button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading || usersLoading}
        >
          {loading || usersLoading ? "Consultando..." : "Actualizar"}
        </button>
      </header>

      {error && (
        <div className="admin-users-error" role="alert">
          <strong>Error de catálogo</strong>
          <p>{error}</p>
        </div>
      )}

      {/* RESUMEN */}

      <div className="admin-users-summary">
        <article className="admin-users-summary-card">
          <span>ROLES REGISTRADOS</span>
          <strong>{loading ? "—" : catalog.roles.length}</strong>
        </article>

        <article className="admin-users-summary-card">
          <span>PERMISOS REGISTRADOS</span>
          <strong>{loading ? "—" : catalog.permissions.length}</strong>
        </article>

        <article className="admin-users-summary-card">
          <span>RELACIONES CONFIGURADAS</span>
          <strong>
            {loading ? "—" : catalog.rolePermissions.length}
          </strong>
        </article>
      </div>

      {/* ACL-03: ASIGNACIONES DE USUARIOS */}

      <section className="admin-panel admin-assignment-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              ACL-03 / USER ROLE ASSIGNMENTS
            </span>

            <h3>Asignaciones de roles</h3>
          </div>

          <span className="admin-panel-code">USER ACCESS</span>
        </div>

        <p className="admin-panel-note">
          Selecciona una cuenta para consultar sus roles, alcances,
          vigencia y estado de autorización.
        </p>

        <div className="admin-assignment-search">
          <label htmlFor="access-user-search">
            BUSCAR USUARIO
          </label>

          <input
            id="access-user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o correo electrónico..."
            disabled={usersLoading}
          />

          <span className="admin-assignment-search-count">
            {usersLoading
              ? "Consultando usuarios..."
              : `${filteredUsers.length} resultados`}
          </span>
        </div>

        {usersError && (
          <div className="admin-users-error" role="alert">
            {usersError}
          </div>
        )}

        <div className="admin-assignment-user-list">
          {usersLoading ? (
            <p>Consultando usuarios...</p>
          ) : filteredUsers.length === 0 ? (
            <p>No se encontraron usuarios.</p>
          ) : (
            filteredUsers.map((user) => {
              const userId = String(user._id || user.id);

              return (
                <button
                  type="button"
                  key={userId}
                  className={`admin-assignment-user ${
                    selectedUserId === userId ? "selected" : ""
                  }`}
                  onClick={() => handleSelectUser(userId)}
                >
                  <span className="admin-assignment-avatar">
                    {(user.name || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <span className="admin-assignment-user-info">
                    <strong>{user.name || "Usuario sin nombre"}</strong>
                    <small>{user.email}</small>
                  </span>

                  <span className="admin-assignment-user-status">
                    {user.status || "Sin estado"}
                  </span>

                  <span className="admin-assignment-arrow">›</span>
                </button>
              );
            })
          )}
        </div>

        {users.length >= 100 && (
          <p className="admin-panel-note">
            Se muestran hasta 100 usuarios. La búsqueda actual se realiza
            dentro de los resultados cargados.
          </p>
        )}

        {/* DETALLE DE ASIGNACIONES */}

        {assignmentsError && (
          <div className="admin-users-error" role="alert">
            <strong>Error de asignaciones</strong>
            <p>{assignmentsError}</p>
          </div>
        )}

        {assignmentsLoading && (
          <div className="admin-assignment-empty">
            Consultando asignaciones del usuario...
          </div>
        )}

        {!assignmentsLoading && selectedUserId && selectedUser && (
          <div className="admin-assignment-details">
            <div className="admin-panel-heading">
              <div>
                <span className="admin-eyebrow">
                  SELECTED ACCOUNT
                </span>

                <h3>{selectedUser.name || "Usuario"}</h3>
                <p>{selectedUser.email}</p>
              </div>

              <span className="admin-assignment-account-status">
                {selectedUser.status || "Sin estado"}
              </span>
            </div>

            <div className="admin-assignment-summary">
              <div>
                <span>ASIGNACIONES</span>
                <strong>{assignments.length}</strong>
              </div>

              <div>
                <span>EFECTIVAS</span>
                <strong>{effectiveCount}</strong>
              </div>

              <div>
                <span>NO EFECTIVAS</span>
                <strong>{assignments.length - effectiveCount}</strong>
              </div>
            </div>

            {assignments.length === 0 ? (
              <div className="admin-assignment-empty">
                Este usuario no tiene asignaciones registradas.
              </div>
            ) : (
              <div className="admin-assignment-cards">
                {assignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment);

                  return (
                    <article
                      className="admin-assignment-card"
                      key={assignment.id}
                    >
                      <div className="admin-assignment-card-top">
                        <div>
                          <span className="admin-eyebrow">
                            ROLE ASSIGNMENT
                          </span>

                          <h4>
                            {assignment.role?.name ||
                              "Rol no disponible"}
                          </h4>

                          <small>
                            {assignment.role?.key || "Sin identificador"}
                          </small>
                        </div>

                        <span
                          className={`admin-assignment-badge ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="admin-assignment-data">
                        <div>
                          <span>ALCANCE</span>
                          <strong>
                            {formatScope(assignment.scope)}
                          </strong>
                        </div>

                        <div>
                          <span>ASIGNADO</span>
                          <strong>
                            {formatDate(assignment.assignedAt)}
                          </strong>
                        </div>

                        <div>
                          <span>VENCIMIENTO</span>
                          <strong>
                            {assignment.expiresAt
                              ? formatDate(assignment.expiresAt)
                              : "Sin vencimiento"}
                          </strong>
                        </div>

                        <div>
                          <span>PROTECCIÓN DEL ROL</span>
                          <strong>
                            {assignment.role?.protected
                              ? "Protegido"
                              : "No protegido"}
                          </strong>
                        </div>

                        <div>
                          <span>ORIGEN</span>
                          <strong>
                            {assignment.source || "No especificado"}
                          </strong>
                        </div>

                        <div>
                          <span>ALCANCE VÁLIDO</span>
                          <strong>
                            {assignment.scopeAllowed ? "Sí" : "No"}
                          </strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedUserId && !usersLoading && (
          <div className="admin-assignment-empty">
            <strong>SELECCIONA UNA CUENTA</strong>
            <p>
              Elige un usuario de la lista para consultar sus asignaciones
              de roles.
            </p>
          </div>
        )}
      </section>

      {/* MATRIZ RBAC */}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              RBAC / PERMISSION MATRIX
            </span>

            <h3>Matriz de permisos</h3>
          </div>

          <span className="admin-panel-code">ACL / 03</span>
        </div>

        <p className="admin-panel-note">
          Cada fila representa un rol. Cada columna representa un permiso.
          La marca indica que existe una relación configurada.
        </p>

        <div className="admin-access-legend">
          <span>
            <strong className="admin-access-allowed">✓</strong>
            Permiso asignado
          </span>

          <span>
            <strong className="admin-access-denied">—</strong>
            Sin asignación
          </span>
        </div>

        {loading ? (
          <p>Construyendo matriz de permisos...</p>
        ) : catalog.roles.length === 0 ||
          catalog.permissions.length === 0 ? (
          <p>No hay suficientes datos para construir la matriz.</p>
        ) : (
          <div className="admin-users-table-wrapper admin-access-matrix-wrapper">
            <table
              className="admin-users-table admin-access-matrix"
              aria-label="Matriz de permisos por rol"
            >
              <thead>
                <tr>
                  <th className="admin-access-role-column">ROL</th>

                  {catalog.permissions.map((permission) => (
                    <th
                      key={String(permission._id)}
                      title={`${permission.name} (${permission.key})`}
                    >
                      <span>{permission.key}</span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {catalog.roles.map((role) => (
                  <tr key={String(role._id)}>
                    <td className="admin-access-role-column">
                      <strong>{role.name}</strong>
                      <small>{role.key}</small>
                    </td>

                    {catalog.permissions.map((permission) => {
                      const assigned = relationSet.has(
                        `${String(role._id)}:${String(permission._id)}`
                      );

                      return (
                        <td
                          key={`${role._id}-${permission._id}`}
                          className={
                            assigned
                              ? "admin-access-cell-assigned"
                              : "admin-access-cell-empty"
                          }
                        >
                          {assigned ? "✓" : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DIRECTORIO DE ROLES */}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              RBAC / ROLE DIRECTORY
            </span>

            <h3>Roles del sistema</h3>
          </div>

          <span className="admin-panel-code">ACL / 01</span>
        </div>

        {loading ? (
          <p>Consultando roles...</p>
        ) : (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>ROL</th>
                  <th>IDENTIFICADOR</th>
                  <th>PERMISOS</th>
                  <th>PROTECCIÓN</th>
                  <th>ESTADO</th>
                </tr>
              </thead>

              <tbody>
                {catalog.roles.map((role) => (
                  <tr key={String(role._id)}>
                    <td><strong>{role.name}</strong></td>
                    <td>{role.key}</td>
                    <td>
                      {permissionsByRole.get(String(role._id))?.length || 0}
                    </td>
                    <td>
                      {role.protected ? "Protegido" : "Modificable"}
                    </td>
                    <td>
                      {role.active ? "Activo" : "Inactivo"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* DIRECTORIO DE PERMISOS */}

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">
              RBAC / PERMISSION DIRECTORY
            </span>

            <h3>Permisos del sistema</h3>
          </div>

          <span className="admin-panel-code">ACL / 02</span>
        </div>

        {loading ? (
          <p>Consultando permisos...</p>
        ) : (
          Array.from(permissionsByModule.entries()).map(
            ([moduleName, permissions]) => (
              <div
                className="admin-access-module-group"
                key={moduleName}
              >
                <h4>{moduleName.toUpperCase()}</h4>

                <div className="admin-users-table-wrapper">
                  <table className="admin-users-table">
                    <thead>
                      <tr>
                        <th>PERMISO</th>
                        <th>IDENTIFICADOR</th>
                        <th>MÓDULO</th>
                        <th>DESCRIPCIÓN</th>
                      </tr>
                    </thead>

                    <tbody>
                      {permissions.map((permission) => (
                        <tr key={String(permission._id)}>
                          <td><strong>{permission.name}</strong></td>
                          <td>{permission.key}</td>
                          <td>{permission.module}</td>
                          <td>
                            {permission.description || "Sin descripción"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )
        )}
      </section>
    </section>
  );
}
