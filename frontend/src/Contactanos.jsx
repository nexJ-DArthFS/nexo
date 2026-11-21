
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Contactanos.css";

function Contactanos() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    motivo: "Información general",
    mensaje: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const texto = `Hola, soy ${form.nombre}.
Correo: ${form.correo}
Motivo: ${form.motivo}
Mensaje: ${form.mensaje}`;

    const url = `https://wa.me/593997223830?text=${encodeURIComponent(texto)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="contact-page">
      <header className="contact-header">
        <Link to="/" className="contact-brand">
          NEXORA
        </Link>
        <Link to="/" className="contact-back">
          ← Volver al inicio
        </Link>
      </header>

      <section className="contact-container">
        <div className="contact-intro">
          <span className="contact-eyebrow">
            ESTAMOS PARA ESCUCHARTE
          </span>

          <h1>
            Hablemos de <span>NEXORA.</span>
          </h1>

          <p>
            ¿Tienes preguntas, sugerencias o necesitas ayuda?
            Escríbenos y estaremos encantados de atenderte.
          </p>

          <div className="contact-direct">
            <span>◉</span>
            <div>
              <strong>Contacto directo</strong>
              <p>Atención mediante WhatsApp.</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Envíanos un mensaje</h2>

          <label>
            Nombre
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
              maxLength={100}
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
              maxLength={150}
            />
          </label>

          <label>
            Motivo de contacto
            <select
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
            >
              <option>Información general</option>
              <option>Soporte técnico</option>
              <option>Alianzas institucionales</option>
              <option>Sugerencias</option>
              <option>Otros</option>
            </select>
          </label>

          <label>
            Mensaje
            <textarea
              name="mensaje"
              value={form.mensaje}
              onChange={handleChange}
              placeholder="¿En qué podemos ayudarte?"
              rows={5}
              required
              maxLength={2000}
            />
          </label>

          <button type="submit" className="contact-submit">
            Continuar en WhatsApp <span>↗</span>
          </button>

          <small>
            WhatsApp se abrirá con tu mensaje preparado.
            Tendrás que enviarlo desde allí.
          </small>
        </form>
      </section>

      <footer className="contact-footer">
        © 2027 NEXORA. Todos los derechos reservados.
      </footer>
    </main>
  );
}

export default Contactanos;
