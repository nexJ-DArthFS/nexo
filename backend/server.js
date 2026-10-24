
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]
  })
);

app.use(express.json({ limit: "100kb" }));

const MAX_NOTE_LENGTH = 20000;

const rules = [
  {
    category: "tasks",
    label: "Tarea",
    patterns: [
      /\b(tengo que|debo|necesito|hay que|pendiente|por hacer|hacer|terminar|entregar|enviar|revisar|estudiar|preparar|llamar|comprar|investigar)\b/i
    ]
  },
  {
    category: "objectives",
    label: "Objetivo",
    patterns: [
      /\b(mi objetivo|objetivo|meta|quiero lograr|quiero alcanzar|me propongo|aspiración|aspirar a)\b/i
    ]
  },
  {
    category: "questions",
    label: "Pregunta",
    patterns: [
      /[¿?]/,
      /\b(me pregunto|no sé si|cómo puedo|por qué|qué pasaría|averiguar si)\b/i
    ]
  },
  {
    category: "decisions",
    label: "Decisión",
    patterns: [
      /\b(decidí|he decidido|decisión|elegí|elegir|optaré|voy a escoger|acordamos|acuerdo)\b/i
    ]
  },
  {
    category: "concerns",
    label: "Preocupación",
    patterns: [
      /\b(me preocupa|preocupado|preocupada|estresado|estresada|agobiado|agobiada|me cuesta|tengo miedo|me siento|agotado|agotada|confundido|confundida)\b/i
    ]
  },
  {
    category: "ideas",
    label: "Idea",
    patterns: [
      /\b(idea|se me ocurre|podría|podemos|sería interesante|propongo|imagino|crear|diseñar|inventar)\b/i
    ]
  },
  {
    category: "knowledge",
    label: "Conocimiento",
    patterns: [
      /\b(aprendí|descubrí|entendí|comprendí|principio|concepto|teorema|definición|significa|consiste en|observé)\b/i
    ]
  }
];

function classifyFragment(text) {
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return {
        category: rule.category,
        label: rule.label
      };
    }
  }

  return {
    category: "review",
    label: "Por revisar"
  };
}

function splitIntoFragments(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n+|(?<=[.!?])\s+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean);
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "NEXORA Notes API"
  });
});

app.post("/api/notes/analyze", (req, res) => {
  const text = req.body?.text;

  if (typeof text !== "string") {
    return res.status(400).json({
      error: "El campo text debe ser una cadena de texto."
    });
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return res.status(400).json({
      error: "Escribe una nota antes de analizarla."
    });
  }

  if (normalizedText.length > MAX_NOTE_LENGTH) {
    return res.status(413).json({
      error: `La nota supera el límite de ${MAX_NOTE_LENGTH} caracteres.`
    });
  }

  const fragments = splitIntoFragments(normalizedText);

  const items = fragments.map((fragment, index) => {
    const classification = classifyFragment(fragment);

    return {
      id: index + 1,
      text: fragment,
      category: classification.category,
      label: classification.label
    };
  });

  const grouped = {
    tasks: [],
    objectives: [],
    questions: [],
    decisions: [],
    concerns: [],
    ideas: [],
    knowledge: [],
    review: []
  };

  for (const item of items) {
    grouped[item.category].push(item);
  }

  return res.json({
    success: true,
    totalFragments: items.length,
    items,
    grouped,
    notice:
      "Clasificación orientativa: revisa los resultados y corrige las categorías que no representen tu intención.",
    privacy:
      "Esta API no guarda las notas en una base de datos. El texto se procesa en memoria durante la solicitud."
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: "El cuerpo de la solicitud contiene JSON inválido."
    });
  }

  console.error("Error en NEXORA API:", error.message);

  return res.status(500).json({
    error: "Ocurrió un error interno al procesar la solicitud."
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`NEXORA API disponible en http://127.0.0.1:${PORT}`);
  console.log(`Comprobación: http://127.0.0.1:${PORT}/api/health`);
});
