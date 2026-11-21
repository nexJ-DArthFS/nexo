
import { API_BASE_URL } from "../../config/api.js";

// =========================================
// UTILIDAD PARA PETICIONES
// =========================================

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Error en la petición (${response.status}).`
    );
  }

  return data;
}

// =========================================
// CONSULTAR USUARIOS
// =========================================

export async function listUsers({
  skip = 0,
  limit = 20,
  status = "",
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  if (status) {
    params.set("status", status);
  }

  return request(`/users?${params.toString()}`, {
    method: "GET",
  });
}

// =========================================
// CONSULTAR PERFIL INDIVIDUAL
// =========================================

export async function getUserById(id) {
  const data = await request(
    `/users/${encodeURIComponent(id)}`,
    { method: "GET" }
  );

  return data.user;
}

// =========================================
// ACTUALIZAR PERFIL
// =========================================

export async function updateUser(id, changes) {
  return request(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

// =========================================
// ACTUALIZAR ESTADO
// =========================================

export async function updateUserStatus(id, status) {
  return request(`/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// =========================================
// ACL-02: CONSULTAR CATÁLOGO
// =========================================

export async function getAccessCatalog() {
  return request("/access/catalog", {
    method: "GET",
  });
}

// =========================================
// ACL-03: CONSULTAR ASIGNACIONES
// =========================================

export async function getUserAssignments(userId) {
  return request(
    `/access/users/${encodeURIComponent(userId)}/assignments`,
    {
      method: "GET",
    }
  );
}

// =========================================
// ACL-04: GESTIÓN DE ASIGNACIONES
// =========================================

// ASIGNAR ROL
export async function assignUserRole(data) {
  return request("/access/assignments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// MODIFICAR ASIGNACIÓN
export async function updateUserAssignment(assignmentId, changes) {
  return request(
    `/access/assignments/${encodeURIComponent(assignmentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(changes),
    }
  );
}

// REVOCAR ASIGNACIÓN
export async function revokeUserAssignment(assignmentId) {
  return request(
    `/access/assignments/${encodeURIComponent(assignmentId)}`,
    {
      method: "DELETE",
    }
  );
}

// =========================================
// MOD-03: GESTIÓN DE MÓDULOS
// =========================================

export async function getModules() {
  return request("/modules", {
    method: "GET",
  });
}

export async function registerModule(moduleData) {
  return request("/modules", {
    method: "POST",
    body: JSON.stringify(moduleData),
  });
}

export async function updateModuleStatus(key, active) {
  return request(
    `/modules/${encodeURIComponent(key)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }
  );
}

// =========================================
// LOG-04: CONSULTAR AUDITORÍA
// =========================================

export async function getAuditLogs({
  skip = 0,
  limit = 20,
} = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  return request(`/audit?${params.toString()}`, {
    method: "GET",
  });
}

// =========================================
// CFG-05: CONFIGURACIÓN DEL SISTEMA
// =========================================

export async function getConfiguration() {
  return request("/configuration", {
    method: "GET",
  });
}

export async function updateConfiguration(settings) {
  return request("/configuration", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
