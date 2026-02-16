import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [a, s, c] = await Promise.all([
          axios.get("/alerts"),
          axios.get("/shelters"),
          axios.get("/emergency-contacts")
        ]);
        setAlerts(a.data);
        setShelters(s.data);
        setContacts(c.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
    socket.on("newAlert", (alert) => setAlerts((prev) => [alert, ...prev]));
    return () => socket.off("newAlert");
  }, []);

  const getPriorityColor = (priority) => {
    if (priority === "High") return "bg-red-600";
    if (priority === "Medium") return "bg-amber-500";
    return "bg-emerald-600";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <Link to="/" className="text-xl font-bold text-red-700">Disaster Alert & Emergency Coordination</Link>
          <div className="flex flex-wrap gap-4 items-center">
            {user ? (
              <>
                {user.role === "admin" && <Link to="/admin" className="text-slate-700 hover:text-red-600 font-medium">Admin</Link>}
                {user.role === "volunteer" && <Link to="/volunteer" className="text-slate-700 hover:text-red-600 font-medium">Volunteer</Link>}
                {user.role === "citizen" && (
                  <>
                    <Link to="/citizen" className="text-slate-700 hover:text-red-600 font-medium">Dashboard</Link>
                    <Link to="/sos" className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700">Send SOS</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-700 hover:text-red-600 font-medium">Login</Link>
                <Link to="/register" className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="bg-red-700 text-white py-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Real-time alerts. Faster rescue. Safer communities.</h1>
        <p className="text-red-100">Report emergencies, find shelters, and get help when it matters most.</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Live Alerts / Announcements */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /> Live Alerts & Announcements
          </h2>
          {alerts.length === 0 ? (
            <p className="text-slate-500 bg-white p-6 rounded-xl shadow">No active alerts right now.</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className="bg-white p-5 rounded-xl shadow-md border-l-4 border-red-600"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-800">{alert.title}</h3>
                    <span className={`text-white text-sm px-3 py-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-slate-600">{alert.message}</p>
                  <p className="text-sm text-slate-400 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Safe Zone / Shelters */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Safe Zones & Shelters</h2>
          {shelters.length === 0 ? (
            <p className="text-slate-500 bg-white p-6 rounded-xl shadow">No shelter information available yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {shelters.map((s) => (
                <div key={s._id} className="bg-white p-5 rounded-xl shadow-md">
                  <h3 className="font-bold text-slate-800">{s.name}</h3>
                  <p className="text-slate-600 text-sm mt-1">{s.address}</p>
                  {s.contactPhone && <p className="text-slate-600 text-sm">Contact: {s.contactPhone}</p>}
                  <p className="text-slate-500 text-xs mt-2">Capacity: {s.currentOccupancy ?? 0} / {s.capacity ?? "N/A"}</p>
                  {s.facilities?.length > 0 && (
                    <p className="text-slate-500 text-xs">Facilities: {s.facilities.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Emergency Contact Directory */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Emergency Contact Directory</h2>
          {contacts.length === 0 ? (
            <p className="text-slate-500 bg-white p-6 rounded-xl shadow">No emergency contacts listed yet.</p>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-slate-700 font-semibold">Type</th>
                    <th className="px-4 py-3 text-slate-700 font-semibold">Name</th>
                    <th className="px-4 py-3 text-slate-700 font-semibold">Phone</th>
                    {contacts.some((c) => c.area) && <th className="px-4 py-3 text-slate-700 font-semibold">Area</th>}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{c.type}</td>
                      <td className="px-4 py-3 text-slate-600">{c.name}</td>
                      <td className="px-4 py-3">
                        <a href={`tel:${c.phone}`} className="text-red-600 font-medium hover:underline">{c.phone}</a>
                      </td>
                      {contacts.some((x) => x.area) && <td className="px-4 py-3 text-slate-500">{c.area || "—"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
