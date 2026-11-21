
const API_URL = "http://localhost:3001/api";

// =========================================
// UTILIDAD PARA PETICIONES
// =========================================

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
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
// CONSULTAR CATÁLOGO DE ACCESOS (ACL-02)
// =========================================

export async function getAccessCatalog() {
  return request("/access/catalog", {
    method: "GET",
  });
}

// =========================================
// ACL-03: CONSULTAR ASIGNACIONES DE USUARIO
// =========================================

export async function getUserAssignments(userId) {
  return request(
    `/access/users/${encodeURIComponent(userId)}/assignments`,
    {
      method: "GET",
    }
  );
}