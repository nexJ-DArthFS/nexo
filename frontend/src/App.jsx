
import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "./AdminDashboard.jsx";
import Welcome from "./Welcome.jsx";
import Auth from "./Auth.jsx";
import Dashboard from "./Dashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminRoute from "./AdminRoute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />

      <Route
        path="/login"
        element={<Auth mode="login" />}
      />

      <Route
        path="/register"
        element={<Auth mode="register" />}
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
           <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
