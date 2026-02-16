import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profRes, reqRes] = await Promise.all([
          axios.get("/volunteers/me"),
          axios.get("/requests/assigned-to-me").catch(() => ({ data: [] }))
        ]);
        setProfile(profRes.data);
        setRequests(reqRes.data || []);
      } catch {
        setProfile({});
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const updateStatus = async (requestId, status) => {
    try {
      await axios.put(`/requests/status/${requestId}`, { status });
      setRequests((prev) => prev.map((r) => (r._id === requestId ? { ...r, status } : r)));
    } catch (e) {
      console.error(e);
    }
  };

  const setAvailability = async (availability) => {
    try {
      await axios.put("/volunteers/me", { availability });
      setProfile((p) => ({ ...p, availability }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-red-700">Volunteer Dashboard</h1>
        <div className="flex gap-2 items-center">
          <span className="text-slate-600">{user?.name}</span>
          <select
            value={profile?.availability || "Offline"}
            onChange={(e) => setAvailability(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Offline">Offline</option>
          </select>
          <Link to="/" className="text-slate-600 hover:text-red-600 text-sm">Home</Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto p-6">
        <section className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">My assigned rescue requests</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500">No requests assigned to you yet.</p>
          ) : (
            <ul className="space-y-4">
              {requests.map((r) => (
                <li key={r._id} className="border rounded-lg p-4">
                  <p className="font-medium text-slate-800">{r.disasterType} – {r.priority}</p>
                  <p className="text-slate-600 text-sm mt-1">{r.description}</p>
                  <p className="text-slate-500 text-xs mt-1">Status: {r.status}</p>
                  {r.status === "Assigned" && (
                    <button
                      onClick={() => updateStatus(r._id, "Resolved")}
                      className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
