import { useState } from "react";
import axios from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { isValidIndianMobile } from "../utils/validation";

const DISASTER_TYPES = ["Flood", "Fire", "Earthquake", "Storm", "Landslide", "Other"];
const PRIORITIES = ["High", "Medium", "Low"];

export default function SOSForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    description: "",
    disasterType: "Flood",
    priority: "High",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.phone && !isValidIndianMobile(form.phone)) {
      setError("Invalid mobile number. Must be 10 digits starting with 6-9.");
      setLoading(false);
      return;
    }

    const getLocation = () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          reject,
          { timeout: 10000 }
        );
      });

    try {
      const location = await getLocation();
      await axios.post("/requests", {
        ...form,
        location
      });
      alert("SOS sent successfully. Help is on the way.");
      navigate("/citizen");
    } catch (err) {
      if (err.message?.includes("geolocation") || err.code === 1) {
        await axios.post("/requests", { ...form, location: { lat: null, lng: null } });
        alert("SOS sent (location not shared). Help is on the way.");
        navigate("/citizen");
      } else {
        setError(err.response?.data?.message || "Failed to send SOS. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-red-700">Emergency Request (SOS)</h1>
          <Link to="/citizen" className="text-slate-600 hover:text-red-600 text-sm">← Dashboard</Link>
        </div>
        <p className="text-slate-600 text-sm mb-2">Describe your situation. We will use your location if you allow it.</p>
        <p className="text-amber-800 bg-amber-50 text-sm mb-6 px-3 py-2 rounded-lg border border-amber-200">
          Your live location will be shared with Admin and volunteers on the rescue map so they can reach you quickly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Disaster type</label>
            <select
              value={form.disasterType}
              onChange={(e) => setForm({ ...form, disasterType: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
            >
              {DISASTER_TYPES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Your contact phone (optional)</label>
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Describe your emergency *</label>
            <textarea
              placeholder="e.g. Trapped on roof, need evacuation. 4 people, one elderly."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 min-h-[120px]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send SOS"}
          </button>
        </form>
      </div>
    </div>
  );
}
