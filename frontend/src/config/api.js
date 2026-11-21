
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

export const API_BASE_URL = `${API_URL}/api`;
