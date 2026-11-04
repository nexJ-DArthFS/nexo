
const express = require("express");
const bcrypt = require("bcryptjs");
const { getDB } = require("../config/db");

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

// REGISTRO
router.post("/register", async (req, res, next) => {
  try {
    console.log("BODY:", req.body);
console.log("NAME:", req.body?.name);
console.log("NAME TYPE:", typeof req.body?.name);



    const name = typeof req.body?.name === "string"
      ? req.body.name.trim()
      : "";

    const email = typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

    const password = typeof req.body?.password === "string"
      ? req.body.password
      : "";

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        error: "El nombre debe tener entre 2 y 80 caracteres."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: "Correo electrónico inválido."
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes."
      });
    }

    const users = getDB().collection("users");

    const existing = await users.findOne({ email });

    if (existing) {
      return res.status(409).json({
        error: "Este correo ya está registrado."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      name,
      email,
      passwordHash,
      createdAt: new Date()
    };

    const result = await users.insertOne(user);
    user._id = result.insertedId;

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = publicUser(user);

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        res.status(201).json({
          success: true,
          user: publicUser(user)
        });
      });
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Este correo ya está registrado."
      });
    }

    next(error);
  }
});

// INICIO DE SESIÓN
router.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

    const password = typeof req.body?.password === "string"
      ? req.body.password
      : "";

    if (!email || !password) {
      return res.status(400).json({
        error: "Introduce tu correo y contraseña."
      });
    }

    const user = await getDB()
      .collection("users")
      .findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        error: "Correo o contraseña incorrectos."
      });
    }

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = publicUser(user);

      req.session.save((saveError) => {
        if (saveError) return next(saveError);

        res.json({
          success: true,
          user: publicUser(user)
        });
      });
    });

  } catch (error) {
    next(error);
  }
});

// CONSULTAR SESIÓN
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      authenticated: false
    });
  }

  res.json({
    authenticated: true,
    user: req.session.user
  });
});

// CERRAR SESIÓN
router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("nexora.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });

    res.json({ success: true });
  });
});

module.exports = router;
