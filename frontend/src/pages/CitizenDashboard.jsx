import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [chatRequest, setChatRequest] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [r, a, s, c] = await Promise.all([
          axios.get("/requests/my"),
          axios.get("/alerts"),
          axios.get("/shelters"),
          axios.get("/emergency-contacts")
        ]);
        setRequests(r.data);
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

  const getStatusColor = (status) => {
    if (status === "Resolved") return "bg-green-100 text-green-800";
    if (status === "Assigned") return "bg-blue-100 text-blue-800";
    if (status === "Approved") return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-red-700">Citizen Dashboard</h1>
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-slate-600">{user?.name}</span>
          <Link to="/sos" className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700">Send SOS</Link>
          <Link to="/" className="text-slate-600 hover:text-red-600">Home</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">My emergency requests</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500">You haven&apos;t sent any SOS yet.</p>
          ) : (
            <ul className="space-y-4">
              {requests.map((r) => (
                <li key={r._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-medium text-slate-800">{r.disasterType} – {r.priority}</p>
                      <p className="text-slate-600 text-sm mt-1">{r.description}</p>
                      <p className="text-slate-500 text-xs mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  {r.assignedVolunteer && (
                    <>
                      <p className="text-slate-600 text-sm mt-2">Assigned to: {r.assignedVolunteer.name} {r.assignedVolunteer.phone && `(${r.assignedVolunteer.phone})`}</p>
                      <button
                        onClick={() => setChatRequest(r)}
                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        💬 Chat with Volunteer
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Live alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-slate-500">No active alerts.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.slice(0, 5).map((a) => (
                <li key={a._id} className="border-l-4 border-red-500 pl-3 py-1">
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-slate-600 text-sm">{a.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Nearby shelters</h2>
          {shelters.length === 0 ? (
            <p className="text-slate-500">No shelter info available.</p>
          ) : (
            <ul className="space-y-2">
              {shelters.slice(0, 5).map((s) => (
                <li key={s._id} className="text-slate-700">
                  <span className="font-medium">{s.name}</span> – {s.address}
                  {s.contactPhone && <span className="text-slate-500 text-sm"> ({s.contactPhone})</span>}
                </li>
              ))}
            </ul>
          )}
          <Link to="/" className="text-red-600 text-sm font-medium mt-2 inline-block">View all on home →</Link>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Emergency contacts</h2>
          {contacts.length === 0 ? (
            <p className="text-slate-500">No emergency contacts listed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-4 text-slate-600 font-semibold">Type</th>
                    <th className="py-2 pr-4 text-slate-600 font-semibold">Name</th>
                    <th className="py-2 pr-4 text-slate-600 font-semibold">Phone</th>
                    {contacts.some((x) => x.area) && <th className="py-2 text-slate-600 font-semibold">Area</th>}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium text-slate-800">{c.type}</td>
                      <td className="py-2 pr-4 text-slate-700">{c.name}</td>
                      <td className="py-2 pr-4">
                        <a href={`tel:${c.phone}`} className="text-red-600 font-medium hover:underline">{c.phone}</a>
                      </td>
                      {contacts.some((x) => x.area) && <td className="py-2 text-slate-500">{c.area || "—"}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {chatRequest && (
        <ChatWindow
          requestId={chatRequest._id}
          otherUser={chatRequest.assignedVolunteer}
          onClose={() => setChatRequest(null)}
        />
      )}
    </div>
  );
}
