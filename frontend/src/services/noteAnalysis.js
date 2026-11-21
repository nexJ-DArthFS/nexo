
import { API_BASE_URL } from "../config/api.js";

// =========================================
// ANALIZAR NOTA
// =========================================

export async function analyzeNote(text) {
  const response = await fetch(`${API_BASE_URL}/notes/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `Error del servidor (${response.status}).`
    );
  }

  return data;
}

// =========================================
// COMPROBAR DISPONIBILIDAD DE LA API
// =========================================

export async function checkNotesApi() {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("No se pudo comprobar la API de NEXORA.");
  }

  return response.json();
}
