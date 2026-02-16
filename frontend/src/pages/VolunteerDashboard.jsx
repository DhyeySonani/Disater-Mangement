import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import RescueMap from "../components/RescueMap";
import ChatWindow from "../components/ChatWindow";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatRequest, setChatRequest] = useState(null);

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

  const isAvailable = profile?.userId?.isAvailable ?? false;

  const toggleAvailability = async () => {
    const next = !isAvailable;
    try {
      await axios.put("/volunteers/me/availability", { isAvailable: next });
      setProfile((p) => (p?.userId ? { ...p, userId: { ...p.userId, isAvailable: next } } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const rescueMapMarkers = useMemo(
    () =>
      (requests || [])
        .filter((r) => r.location?.lat != null && r.location?.lng != null && Number.isFinite(r.location.lat) && Number.isFinite(r.location.lng))
        .map((r) => ({
          id: r._id,
          lat: r.location.lat,
          lng: r.location.lng,
          title: `${r.disasterType} – ${r.priority}`,
          description: r.description,
          phone: r.userId?.phone || r.phone
        })),
    [requests]
  );

  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-red-700">Volunteer Dashboard</h1>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-slate-600">{user?.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Availability:</span>
            <button
              type="button"
              onClick={toggleAvailability}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${isAvailable ? "bg-emerald-500" : "bg-slate-300"}`}
              role="switch"
              aria-checked={isAvailable}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${isAvailable ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
            <span className="text-sm font-medium text-slate-700 min-w-[52px]">
              {isAvailable ? "Online" : "Offline"}
            </span>
          </div>
          <Link to="/" className="text-slate-600 hover:text-red-600 text-sm">Home</Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto p-6">
        {rescueMapMarkers.length > 0 && (
          <section className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Rescue locations (tap marker for details)</h2>
            <RescueMap markers={rescueMapMarkers} height="360px" />
          </section>
        )}
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
                  <div className="flex gap-2 mt-2">
                    {r.status === "Assigned" && (
                      <button
                        onClick={() => updateStatus(r._id, "Resolved")}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => setChatRequest(r)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      💬 Chat with Citizen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {chatRequest && (
        <ChatWindow
          requestId={chatRequest._id}
          otherUser={chatRequest.userId}
          onClose={() => setChatRequest(null)}
        />
      )}
    </div>
  );
}
