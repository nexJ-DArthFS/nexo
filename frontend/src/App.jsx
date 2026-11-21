
import { Navigate, Route, Routes } from "react-router-dom";

import Welcome from "./Welcome.jsx";
import Contactanos from "./Contactanos.jsx";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";
import AdminDashboard from "./AdminDashboard.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

export default function App() {
  return (
    <>
      <Routes>
        {/* =====================================
            PÁGINA PÚBLICA
        ===================================== */}

        <Route path="/" element={<Welcome />} />

        <Route path="/contacto" element={<Contactanos />} />

        {/* =====================================
            AUTENTICACIÓN
        ===================================== */}

        <Route
          path="/login"
          element={<Auth mode="login" />}
        />

        <Route
          path="/register"
          element={<Auth mode="register" />}
        />

        {/* =====================================
            APLICACIÓN PRIVADA
        ===================================== */}

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* =====================================
            PANEL ADMINISTRATIVO
        ===================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* =====================================
            RUTAS NO ENCONTRADAS
        ===================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      {/* =====================================
          INTEGRACIÓN ELFSIGHT
      ===================================== */}

      <div
        className="elfsight-app-73e93717-47a7-4fdb-a6b3-012d4954344d"
        data-elfsight-app-lazy
      />
    </>
  );
}
