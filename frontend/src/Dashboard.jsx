import { useEffect, useRef, useState } from "react";
import "./App.css";
import { analyzeNote } from "./services/noteAnalysis";

const THEMES = [
  { id: "solarpunk", name: "Solarpunk", emoji: "🌱", color: "#c8f36b", description: "Hábitat vivo" },
  { id: "matrix", name: "Matrix", emoji: "⌘", color: "#52ff91", description: "Núcleo digital" },
  { id: "alien", name: "Alienígena", emoji: "👽", color: "#b99cff", description: "Otro mundo" },
  { id: "fantasy", name: "Fantasía", emoji: "🔮", color: "#e6a6ff", description: "Archivo arcano" },
  { id: "work", name: "Trabajo", emoji: "💼", color: "#80c8ff", description: "Estudio profesional" },
  { id: "stoic", name: "Estoico", emoji: "🏛️", color: "#d9c69a", description: "Templo de la razón" },
  { id: "minimal", name: "Minimalista", emoji: "◯", color: "#f1f1e9", description: "Espacio esencial" },
];

const INITIAL_TASKS = [
  { id: "task-1", title: "Estudiar Cálculo I", area: "Aprendizaje", done: false },
  { id: "task-2", title: "Construir el hábitat NEXORA", area: "Creación", done: false },
  { id: "task-3", title: "Ordenar mis apuntes", area: "Conocimiento", done: true },
];

function readLocal(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function App() {
  function addCustomTool(event) {
  event.preventDefault();

  const name = toolName.trim();
  const description = toolDescription.trim();
  const url = toolUrl.trim();

  if (!name) return;

  if (url) {
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        alert("Utiliza una dirección web que comience con http:// o https://");
        return;
      }
    } catch {
      alert("Introduce una dirección web válida.");
      return;
    }
  }

  setCustomTools((current) => [
    ...current,
    {
      id: globalThis.crypto?.randomUUID?.() ?? `tool-${Date.now()}`,
      name,
      description: description || "Herramienta personalizada",
      url,
    },
  ]);

  setToolName("");
  setToolDescription("");
  setToolUrl("");
  setAddToolOpen(false);
}
  const [theme, setTheme] = useState(() => {
    const saved = readLocal("nexora-theme", "solarpunk");
    return THEMES.some((item) => item.id === saved) ? saved : "solarpunk";
  });

  const [lightMode, setLightMode] = useState(() => {
    const saved = readLocal("nexora-light-mode", "light");
    return saved === "dark" ? "dark" : "light";
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexora-sidebar-collapsed") ?? "true");
    } catch {
      return true;
    }
  });

  const [customTools, setCustomTools] = useState(() => {
    const saved = readLocal("nexora-custom-tools", []);
    return Array.isArray(saved) ? saved : [];
  });
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolUrl, setToolUrl] = useState("");

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [page, setPage] = useState("inicio");
  const [diaryText, setDiaryText] = useState(() => readLocal("nexora-diary", ""));
  const [tasks, setTasks] = useState(() => readLocal("nexora-tasks", INITIAL_TASKS));
  const [newTask, setNewTask] = useState("");

  const logoTaps = useRef(0);
  const logoTimer = useRef(null);
  const diaryRef = useRef(null);

  const activeTheme = THEMES.find((item) => item.id === theme) ?? THEMES[0];
  const completed = tasks.filter((task) => task.done).length;
  const pending = tasks.length - completed;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const today = new Date().toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const navigation = [
    { id: "inicio", icon: "⌂", label: "Hábitat" },
    { id: "tareas", icon: "↗", label: "Acciones" },
    { id: "agenda", icon: "◷", label: "Ritmo" },
    { id: "documentos", icon: "▧", label: "Archivo vivo" },
  ];

  const headings = {
    inicio: ["Tu hábitat", "Un lugar para cultivar lo que importa."],
    tareas: ["Lo que florece", "Pequeñas acciones, progreso real."],
    agenda: ["Tu propio ritmo", "Organiza el tiempo sin vivir contra él."],
    documentos: ["Archivo vivo", "Ideas, recursos y conocimiento en crecimiento."],
  };

  const visibleTasks = page === "tareas" ? tasks : tasks.filter((task) => !task.done);

  const [noteAnalysis, setNoteAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("nexora-sidebar-collapsed", JSON.stringify(sidebarCollapsed));
    } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem("nexora-theme", JSON.stringify(theme));
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("nexora-light-mode", JSON.stringify(lightMode));
    } catch {}
  }, [lightMode]);

  useEffect(() => {
    try {
      localStorage.setItem("nexora-diary", JSON.stringify(diaryText));
    } catch {}
  }, [diaryText]);

  useEffect(() => {
    try {
      localStorage.setItem("nexora-tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    return () => clearTimeout(logoTimer.current);
  }, []);

  useEffect(() => {
  try {
    localStorage.setItem(
      "nexora-custom-tools",
      JSON.stringify(customTools)
    );
  } catch {}
}, [customTools]);

  useEffect(() => {
    const anyOverlayOpen = selectorOpen || diaryOpen || toolsOpen || addToolOpen;
    if (!anyOverlayOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (addToolOpen) {
          setAddToolOpen(false);
        } else if (toolsOpen) {
          setToolsOpen(false);
        } else {
          setSelectorOpen(false);
          setDiaryOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    if (diaryOpen) diaryRef.current?.focus();


    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectorOpen, diaryOpen, toolsOpen, addToolOpen]);

  function handleLogoTap(event) {
    event.preventDefault();
    logoTaps.current += 1;
    clearTimeout(logoTimer.current);

    if (logoTaps.current >= 3) {
      logoTaps.current = 0;
      setSelectorOpen(false);
      setDiaryOpen(true);
      return;
    }

    logoTimer.current = setTimeout(() => {
      logoTaps.current = 0;
    }, 850);
  }

  function addTask(event) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    const id = globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}`;

    setTasks((current) => [
      ...current,
      { id, title, area: "Cultivo personal", done: false },
    ]);

    setNewTask("");
    setPage("tareas");
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) => task.id === id ? { ...task, done: !task.done } : task)
    );
  }

  function selectTheme(id) {
    setTheme(id);
    setSelectorOpen(false);
  }

  function toggleLightMode() {
    setLightMode((current) => current === "light" ? "dark" : "light");
  }

  
async function handleAnalyzeNote() {
  if (!diaryText || !diaryText.trim()) {
    setAnalysisError("Escribe algo en tu nota antes de analizarla.");
    setNoteAnalysis(null);
    return;
  }

  setAnalysisLoading(true);
  setAnalysisError("");
  setNoteAnalysis(null);

  try {
    const result = await analyzeNote(diaryText);
    setNoteAnalysis(result);
  } catch (error) {
    setAnalysisError(
      error.message || "No se pudo analizar la nota."
    );
  } finally {
    setAnalysisLoading(false);
  }
}


  return (
    <div
      className={`nexora theme-${theme} mode-${lightMode} ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"}`}
      data-theme={theme}
      data-mode={lightMode}
    >
      <aside className="sidebar">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          <span>{sidebarCollapsed ? "»" : "«"}</span>
        </button>

        <a
          href="#inicio"
          className="brand"
          onClick={handleLogoTap}
          aria-label="NEXORA. Toca tres veces para abrir Hoja en blanco"
          title="Tres toques: Hoja en blanco"
        >
          <span className="brand-mark">
            <span className="brand-orbit" />
            <span className="brand-letter">N</span>
            <span className="brand-star">✳</span>
          </span>
          <span className="brand-copy">
            <strong>nexora<span>.</span></strong>
            <small>HABITAT DIGITAL</small>
          </span>
        </a>

        <p className="side-label">TU ENTORNO</p>

        <nav className="side-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
              title={item.label}
              aria-label={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "tareas" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <button
          className={`appearance-trigger ${selectorOpen ? "appearance-active" : ""}`}
          onClick={() => setSelectorOpen((open) => !open)}
          aria-expanded={selectorOpen}
          aria-controls="appearance-selector"
          title="Cambiar apariencia"
        >
          <span className="appearance-glyph"><span>✳</span></span>
          <span className="appearance-copy">
            <strong>Apariencia</strong>
            <small>{activeTheme.name} · Estilo actual</small>
          </span>
          <span className={`appearance-chevron ${selectorOpen ? "turned" : ""}`}>⌃</span>
        </button>

        <div className="sidebar-hint">
          Tres toques en el logo · Hoja en blanco
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Mi ecosistema</span>
            <span className="slash">/</span>
            <strong>{navigation.find((item) => item.id === page)?.label}</strong>
          </div>

          <div className="topbar-meta">
            <span className="sync-dot" />
            <span>Guardado en este dispositivo</span>

            <button
  className="topbar-icon tools-trigger"
  onClick={() => setToolsOpen((open) => !open)}
  aria-label="Abrir herramientas"
  aria-expanded={toolsOpen}
  aria-controls="nexora-tools-panel"
  title="Herramientas"
>
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    {Array.from({ length: 9 }, (_, i) => (
      <circle
        key={i}
        cx={5 + (i % 3) * 7}
        cy={5 + Math.floor(i / 3) * 7}
        r="1.5"
      />
    ))}
  </svg>
</button>

            <button
              className="theme-toggle"
              onClick={toggleLightMode}
              aria-label={lightMode === "light" ? "Activar modo oscuro" : "Activar modo claro"}
              title={lightMode === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              {lightMode === "light" ? "☾" : "☀"}
            </button>
          </div>
        </header>

        <div className="content">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span>✳</span>{today}</div>
              <h1>{headings[page][0]}<span>.</span></h1>
              <p>{headings[page][1]}</p>
              <div className="hero-actions">
                <button className="primary-action" onClick={() => setPage("tareas")}>
                  Ver mis acciones <span>↗</span>
                </button>
                <button className="secondary-action" onClick={() => setDiaryOpen(true)}>
                  Escribir una idea <span>✎</span>
                </button>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />
              <div className="visual-orbit orbit-three" />
              <div className="visual-planet">
                <span className="planet-glow" />
                <span className="planet-land land-one" />
                <span className="planet-land land-two" />
                <span className="planet-land land-three" />
              </div>
              <span className="visual-star star-one">✳</span>
              <span className="visual-star star-two">✦</span>
              <span className="visual-star star-three">·</span>
            </div>
          </section>

          {page === "inicio" && (
            <section className="stats-grid">
              <article className="stat-card stat-focus">
                <div className="stat-label"><span className="stat-icon">◉</span>Tu enfoque</div>
                <strong>{pending.toString().padStart(2, "0")}<em> acciones</em></strong>
                <p>Pequeños pasos por delante</p>
                <small>01 / FOCUS</small>
                <span className="stat-decoration focus-decoration">◎</span>
              </article>

              <article className="stat-card stat-done">
                <div className="stat-label"><span className="stat-icon">✳</span>Lo que has cultivado</div>
                <strong>{completed.toString().padStart(2, "0")}<em> completadas</em></strong>
                <p>Cada avance cuenta</p>
                <small>02 / MOMENTUM</small>
                <span className="stat-decoration bars-decoration">▂▅▇</span>
              </article>

              <article className="stat-card stat-cycle">
                <div className="stat-label"><span className="stat-icon">◉</span>Tu ciclo actual</div>
                <strong>{progress}<em>%</em></strong>
                <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
                <p>Progreso de tus acciones</p>
                <small>03 / CONTINUITY</small>
              </article>
            </section>
          )}

          <div className="section-heading">
            <span>EL ECOSISTEMA EN MOVIMIENTO</span>
            <span>01 — 03</span>
          </div>

          <section className="workspace">
            <article className="task-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">
                    {page === "documentos" ? "MEMORIA Y RECURSOS" : page === "agenda" ? "TIEMPO Y ATENCIÓN" : "TU SIGUIENTE MOVIMIENTO"}
                  </span>
                  <h2>
                    {page === "documentos" ? "Un lugar para tus ideas." : page === "agenda" ? "Encuentra tu ritmo." : page === "tareas" ? "Acciones en crecimiento." : "Acciones recientes"}
                  </h2>
                </div>
                <span className="panel-number">N° 001</span>
              </div>

              {page === "documentos" ? (
                <div className="empty-state">
                  <span>▧</span>
                  <h3>Un terreno por explorar.</h3>
                  <p>Aquí conectaremos documentos, notas y recursos en futuras etapas.</p>
                </div>
              ) : page === "agenda" ? (
                <div className="empty-state">
                  <span>◷</span>
                  <h3>El tiempo también necesita espacio.</h3>
                  <p>La agenda podrá conectar compromisos, periodos de estudio y descanso.</p>
                </div>
              ) : (
                <>
                  <div className="task-list">
                    {visibleTasks.map((task, index) => (
                      <label key={task.id} className={`task-row ${task.done ? "completed" : ""}`}>
                        <span className="task-number">{String(index + 1).padStart(2, "0")}</span>
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                          aria-label={`Marcar ${task.title} como ${task.done ? "pendiente" : "completada"}`}
                        />
                        <span className="custom-check">{task.done ? "✓" : ""}</span>
                        <span className="task-copy">
                          <strong>{task.title}</strong>
                          <small>{task.area}</small>
                        </span>
                        <span className="task-tag">{task.done ? "Cultivada" : "En curso"}</span>
                      </label>
                    ))}

                    {visibleTasks.length === 0 && (
                      <div className="empty-state small-empty">
                        <span>✳</span>
                        <h3>Todo en calma.</h3>
                        <p>No hay acciones pendientes.</p>
                      </div>
                    )}
                  </div>

                  <form className="add-task" onSubmit={addTask}>
                    <span className="add-seed">＋</span>
                    <input
                      id="new-task"
                      value={newTask}
                      onChange={(event) => setNewTask(event.target.value)}
                      placeholder="¿Qué quieres cultivar hoy?"
                      maxLength={120}
                      aria-label="Nueva acción"
                    />
                    <button type="submit" disabled={!newTask.trim()}>Añadir <span>↗</span></button>
                  </form>
                </>
              )}
            </article>

            <aside className="inspiration-card">
              <div className="inspiration-kicker"><span>✳</span> NOTA DEL HÁBITAT</div>
              <div className="inspiration-art" aria-hidden="true">
                <span className="inspiration-sun" />
                <i className="inspiration-stem" />
                <i className="inspiration-leaf leaf-one" />
                <i className="inspiration-leaf leaf-two" />
                <i className="inspiration-leaf leaf-three" />
              </div>
              <span className="inspiration-edition">PRINCIPIO 001</span>
              <h2>Crecer no siempre significa hacer más.</h2>
              <p>A veces significa comprender, descansar, cambiar de dirección o dejar que una idea encuentre su forma.</p>
              <div className="inspiration-footer">
                <span>UN SISTEMA PARA LA VIDA</span><span>↗</span>
              </div>
            </aside>
          </section>

          <footer className="page-footer">
            <span><strong>NEXORA</strong> · Un espacio para lo que estás construyendo.</span>
            <button onClick={() => setDiaryOpen(true)}>Hoja en blanco ↗</button>
          </footer>
        </div>
      </main>

      {toolsOpen && (
  <div
    className="tools-dismiss"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setToolsOpen(false);
      }
    }}
  >
    <section
      id="nexora-tools-panel"
      className="tools-panel"
      role="dialog"
      aria-label="Herramientas de NEXORA"
    >
      <div className="tools-panel-header">
        <div>
          <span className="tools-eyebrow">NEXORA / UTILIDADES</span>
          <h2>Tu caja de herramientas<span>.</span></h2>
        </div>

        <button
          className="tools-close"
          onClick={() => setToolsOpen(false)}
          aria-label="Cerrar herramientas"
        >
          ×
        </button>
      </div>

      <p className="tools-description">
        Accede a tus espacios de trabajo desde un solo lugar.
      </p>

      <div className="tools-grid">
        <button
          className="tool-item"
          onClick={() => {
            setToolsOpen(false);
            setDiaryOpen(true);
          }}
        >
          <span className="tool-icon">✎</span>
          <strong>Notas libres</strong>
          <small>Escribe tus ideas</small>
        </button>

        {customTools.map((tool) => (
  <div className="tool-item custom-tool-item" key={tool.id}>
    <button
      className="custom-tool-open"
      onClick={() => {
        if (tool.url) {
          window.open(tool.url, "_blank", "noopener,noreferrer");
        } else {
          alert("Esta herramienta todavía no tiene una dirección web.");
        }
      }}
      title={`Abrir ${tool.name}`}
    >
      <span className="tool-icon">✧</span>
      <strong>{tool.name}</strong>
      <small>{tool.description}</small>
    </button>

    <button
      className="custom-tool-delete"
      onClick={() => {
        if (window.confirm(`¿Eliminar la herramienta "${tool.name}"?`)) {
          setCustomTools((current) =>
            current.filter((item) => item.id !== tool.id)
          );
        }
      }}
      title={`Eliminar ${tool.name}`}
      aria-label={`Eliminar ${tool.name}`}
    >
      ×
    </button>
  </div>
))}

<button
  className="tool-item add-tool-item"
  onClick={() => setAddToolOpen(true)}
>
  <span className="tool-icon add-tool-icon">＋</span>
  <strong>Añadir herramienta</strong>
  <small>Personaliza tu espacio</small>
</button>

        <button
          className="tool-item"
          onClick={() => {
            setToolsOpen(false);
            setPage("tareas");
          }}
        >
          <span className="tool-icon">↗</span>
          <strong>Gestor de tareas</strong>
          <small>Organiza tus acciones</small>
        </button>

        <button
          className="tool-item"
          onClick={() => {
            setToolsOpen(false);
            setPage("agenda");
          }}
        >
          <span className="tool-icon">◷</span>
          <strong>Agenda</strong>
          <small>Tu tiempo y ritmo</small>
        </button>

        <button
          className="tool-item"
          onClick={() => {
            setToolsOpen(false);
            setPage("documentos");
          }}
        >
          <span className="tool-icon">▧</span>
          <strong>Documentos</strong>
          <small>Tu archivo personal</small>
        </button>

        <button
          className="tool-item"
          onClick={() => {
            setToolsOpen(false);
            setSelectorOpen(true);
          }}
        >
          <span className="tool-icon">✳</span>
          <strong>Apariencias</strong>
          <small>Cambia tu universo</small>
        </button>

        <button
          className="tool-item"
          onClick={() => {
            setToolsOpen(false);
            setLightMode((mode) =>
              mode === "light" ? "dark" : "light"
            );
          }}
        >
          <span className="tool-icon">
            {lightMode === "light" ? "☾" : "☀"}
          </span>
          <strong>Tema visual</strong>
          <small>
            {lightMode === "light" ? "Activar modo oscuro" : "Activar modo claro"}
          </small>
        </button>
      </div>

      <div className="tools-panel-footer">
        <span className="tools-status-dot" />
        Herramientas de tu hábitat digital
      </div>
    </section>
    {addToolOpen && (
  <div className="add-tool-overlay">
    <form className="add-tool-form" onSubmit={addCustomTool}>
      <div className="add-tool-form-heading">
        <div>
          <span className="tools-eyebrow">NEXORA / PERSONALIZACIÓN</span>
          <h3>Nueva herramienta<span>.</span></h3>
        </div>

        <button
          type="button"
          className="tools-close"
          onClick={() => setAddToolOpen(false)}
          aria-label="Cerrar formulario"
        >
          ×
        </button>
      </div>

      <label>
        Nombre
        <input
          value={toolName}
          onChange={(event) => setToolName(event.target.value)}
          placeholder="Ej. Calculadora matemática"
          maxLength={50}
          required
        />
      </label>

      <label>
        Descripción
        <input
          value={toolDescription}
          onChange={(event) => setToolDescription(event.target.value)}
          placeholder="¿Para qué sirve?"
          maxLength={90}
        />
      </label>

      <label>
        Dirección web (opcional)
        <input
          type="url"
          value={toolUrl}
          onChange={(event) => setToolUrl(event.target.value)}
          placeholder="https://ejemplo.com"
        />
      </label>

      <p className="add-tool-help">
        Puedes guardar un acceso a una página web. Si dejas la dirección vacía,
        la herramienta aparecerá en tu panel, pero no tendrá un destino para abrir.
      </p>

      <div className="add-tool-actions">
        <button
          type="button"
          className="add-tool-cancel"
          onClick={() => setAddToolOpen(false)}
        >
          Cancelar
        </button>

        <button type="submit" className="add-tool-save">
          Guardar herramienta ↗
        </button>
      </div>
        </form>
      </div>
    )}
  </div>
)}

      {selectorOpen && (
        <div
          className="selector-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectorOpen(false);
          }}
        >
          <section
            id="appearance-selector"
            className="universe-selector"
            role="dialog"
            aria-modal="true"
            aria-label="Elegir apariencia"
          >
            <div className="selector-topline">
              <span className="selector-kicker"><i /> NEXORA / VISUAL SYSTEM</span>
              <button className="selector-close" onClick={() => setSelectorOpen(false)} aria-label="Cerrar selector">×</button>
            </div>

            <h2>Elige tu <span>universo</span></h2>
            <p className="selector-subtitle">Una misma esencia. Siete formas de habitarla.</p>

            <div className="universe-arc" aria-label="Apariencias disponibles">
              <div className="arc-track arc-track-outer" />
              <div className="arc-track arc-track-inner" />

              {THEMES.map((item) => (
                <button
                  key={item.id}
                  className={`universe-option option-${item.id} ${item.id === theme ? "chosen" : ""}`}
                  style={{ "--theme-color": item.color }}
                  onClick={() => selectTheme(item.id)}
                  aria-pressed={item.id === theme}
                  aria-label={`Usar apariencia ${item.name}`}
                >
                  <span className="universe-icon">{item.emoji}</span>
                  <span className="universe-name">{item.name}</span>
                </button>
              ))}

              <div className="arc-core">
                <span className="core-orbit" />
                <span className="core-symbol">{activeTheme.emoji}</span>
                <small>UNIVERSO ACTIVO</small>
                <strong>{activeTheme.name}</strong>
                <span className="core-subtitle">{activeTheme.description}</span>
              </div>
              <div className="arc-bottom-glow" />
            </div>

            <div className="selector-footer">
              <span><i /> ESTILO ACTUAL: <strong>{activeTheme.name.toUpperCase()}</strong></span>
              <span>ESC · CERRAR</span>
            </div>
          </section>
        </div>
      )}

      {diaryOpen && (
        <section className="diary-screen" role="dialog" aria-modal="true" aria-label="Hoja en blanco">
          <header className="diary-header">
            <div className="diary-brand">
              <span>N</span>
              <strong>NEXORA <small>/ ESPACIO INTERIOR</small></strong>
            </div>
            <button onClick={() => setDiaryOpen(false)} className="diary-exit">
              × <span>Volver al hábitat</span>
            </button>
          </header>

          <main className="diary-landscape">
            <div className="diary-intro">
              <span className="diary-kicker">SIN PLAN. SIN EXPECTATIVAS.</span>
              <h1>Hoja en blanco<span>.</span></h1>
              <p>No necesitas tenerlo todo claro para empezar.<br />Este espacio es tuyo.</p>
            </div>

            <article className="diary-sheet">
              <div className="sheet-heading">
                <span>APUNTES DEL PRESENTE</span>
                <span>{new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <textarea
                ref={diaryRef}
                className="diary-textarea"
                value={diaryText}
                onChange={(event) => setDiaryText(event.target.value)}
                placeholder={"Escribe lo que quieras.\n\nUna idea, un recuerdo, una pregunta, un sueño o simplemente lo que pasa por tu mente..."}
                aria-label="Escritura libre"
                spellCheck
              />
              
<button
  type="button"
  className="note-analysis-button"
  onClick={handleAnalyzeNote}
  disabled={analysisLoading || !diaryText.trim()}
>
  {analysisLoading ? "Analizando..." : "Analizar nota"}
</button>


{analysisError && (
  <p className="note-analysis-error" role="alert">
    {analysisError}
  </p>
)}

{noteAnalysis && (
  <section className="note-analysis-results">
    <h3>Análisis de tu nota</h3>

    <p className="note-analysis-summary">
      Se identificaron {noteAnalysis.totalFragments} fragmentos.
      Revisa las categorías: son sugerencias automáticas.
    </p>

    {[
      ["tasks", "Tareas"],
      ["objectives", "Objetivos"],
      ["ideas", "Ideas"],
      ["questions", "Preguntas"],
      ["decisions", "Decisiones"],
      ["concerns", "Preocupaciones"],
      ["knowledge", "Conocimientos"],
      ["review", "Por revisar"]
    ].map(([key, title]) => {
      const entries = noteAnalysis.grouped?.[key] || [];

      if (entries.length === 0) return null;

      return (
        <div className="note-analysis-group" key={key}>
          <h4>
            {title} ({entries.length})
          </h4>

          <ul>
            {entries.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        </div>
      );
    })}

    <p className="note-analysis-disclaimer">
      {noteAnalysis.notice}
    </p>
  </section>
)}

              <div className="sheet-footer">
                <span>PUEDES EMPEZAR EN CUALQUIER PARTE.</span>
                <span className="local-save-label">BORRADOR LOCAL</span>
              </div>
            </article>

           
<footer className="diary-footer">
  <span>Respira. Escribe. Permanece un momento.</span>

  <button
    type="button"
    onClick={() => {
      if (
        diaryText &&
        window.confirm("¿Borrar todo el contenido de esta hoja?")
      ) {
        setDiaryText("");
        setNoteAnalysis(null);
        setAnalysisError("");
      }
    }}
  >
    Limpiar hoja
  </button>
</footer>


          </main>
        </section>
      )}
    </div>
  );
}


export default App;