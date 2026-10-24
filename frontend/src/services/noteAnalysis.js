
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";

export async function analyzeNote(text) {
  const response = await fetch(`${API_URL}/api/notes/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
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

export async function checkNotesApi() {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("No se pudo comprobar la API de NEXORA.");
  }

  return response.json();
}
