import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import SOSForm from "./pages/SOSForm";
import socket from "./socket";
import { useAuth } from "./context/AuthContext";

function VolunteerRemovedListener() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onVolunteerRemoved = ({ userId }) => {
      if (user?.role === "volunteer" && String(user?.id) === String(userId)) {
        logout();
        navigate("/login", { replace: true });
      }
    };
    socket.on("volunteerRemoved", onVolunteerRemoved);
    return () => socket.off("volunteerRemoved", onVolunteerRemoved);
  }, [user?.id, user?.role, logout, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <VolunteerRemovedListener />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/citizen"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute allowedRoles={["volunteer"]}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sos"
          element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SOSForm />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
