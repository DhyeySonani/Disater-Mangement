import { useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("/auth/login", form);
      login(res.data.token, res.data.user ? { id: res.data.user._id, role: res.data.user.role, name: res.data.user.name, email: res.data.user.email } : null);
      const role = res.data.user?.role || JSON.parse(atob(res.data.token.split(".")[1])).role;
      if (role === "admin") navigate("/admin");
      else if (role === "volunteer") navigate("/volunteer");
      else navigate("/citizen");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-red-700 mb-1">Disaster Alert Platform</h1>
        <p className="text-slate-600 text-sm mb-6">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center text-slate-600 text-sm">
          Don&apos;t have an account? <Link to="/register" className="text-red-600 font-medium">Register</Link>
        </p>
        <Link to="/" className="block text-center text-slate-500 text-sm mt-2">Back to home</Link>
      </div>
    </div>
  );
}
