import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("analytics");
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [alertForm, setAlertForm] = useState({ title: "", message: "", disasterType: "Flood", priority: "High" });
  const [shelterForm, setShelterForm] = useState({ name: "", address: "", lat: "", lng: "", capacity: "", contactPhone: "", facilities: "" });
  const [contactForm, setContactForm] = useState({ name: "", phone: "", type: "Helpline", area: "" });

  const fetchStats = () => axios.get("/admin/stats").then((r) => setStats(r.data));
  const fetchAlerts = () => axios.get("/alerts").then((r) => setAlerts(r.data));
  const fetchRequests = () => axios.get("/requests").then((r) => setRequests(r.data));
  const fetchVolunteers = () => axios.get("/volunteers").then((r) => setVolunteers(r.data));
  const fetchShelters = () => axios.get("/shelters").then((r) => setShelters(r.data));
  const fetchContacts = () => axios.get("/emergency-contacts").then((r) => setContacts(r.data));

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === "alerts") fetchAlerts();
    if (tab === "requests") {
      fetchRequests();
      fetchVolunteers();
    }
    if (tab === "volunteers") fetchVolunteers();
    if (tab === "shelters") fetchShelters();
    if (tab === "contacts") fetchContacts();
  }, [tab]);

  const createAlert = async (e) => {
    e.preventDefault();
    await axios.post("/alerts", alertForm);
    setAlertForm({ title: "", message: "", disasterType: "Flood", priority: "High" });
    fetchAlerts();
    fetchStats();
  };

  const deleteAlert = async (id) => {
    if (!confirm("Delete this alert?")) return;
    await axios.delete(`/alerts/${id}`);
    fetchAlerts();
    fetchStats();
  };

  const approveRequest = async (id) => {
    await axios.put(`/requests/approve/${id}`);
    fetchRequests();
    fetchStats();
  };

  const assignVolunteer = async (requestId, volunteerId) => {
    await axios.put(`/requests/assign/${requestId}`, { volunteerId });
    fetchRequests();
    fetchStats();
  };

  const createShelter = async (e) => {
    e.preventDefault();
    await axios.post("/shelters", {
      ...shelterForm,
      lat: Number(shelterForm.lat),
      lng: Number(shelterForm.lng),
      capacity: Number(shelterForm.capacity) || 0,
      facilities: shelterForm.facilities ? shelterForm.facilities.split(",").map((s) => s.trim()) : []
    });
    setShelterForm({ name: "", address: "", lat: "", lng: "", capacity: "", contactPhone: "", facilities: "" });
    fetchShelters();
  };

  const createContact = async (e) => {
    e.preventDefault();
    await axios.post("/emergency-contacts", contactForm);
    setContactForm({ name: "", phone: "", type: "Helpline", area: "" });
    fetchContacts();
  };

  const tabs = [
    { id: "analytics", label: "Analytics" },
    { id: "alerts", label: "Alerts" },
    { id: "requests", label: "Requests" },
    { id: "volunteers", label: "Volunteers" },
    { id: "shelters", label: "Shelters" },
    { id: "contacts", label: "Emergency Contacts" }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-red-700">Admin Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-slate-600">{user?.name}</span>
          <Link to="/" className="text-slate-600 hover:text-red-600">Home</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${tab === t.id ? "bg-red-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card title="Total Users" value={stats.totalUsers} />
              <Card title="Total Alerts" value={stats.totalAlerts} />
              <Card title="Total Requests" value={stats.totalRequests} />
              <Card title="Shelters" value={stats.totalShelters} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card title="Pending" value={stats.pendingRequests} sub="requests" />
              <Card title="Approved" value={stats.approvedRequests} sub="requests" />
              <Card title="Assigned" value={stats.assignedRequests} sub="requests" />
              <Card title="Resolved" value={stats.resolvedRequests} sub="requests" />
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="space-y-6">
            <form onSubmit={createAlert} className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Post new alert</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  placeholder="Title"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  className="border rounded-lg px-4 py-2"
                  required
                />
                <select
                  value={alertForm.disasterType}
                  onChange={(e) => setAlertForm({ ...alertForm, disasterType: e.target.value })}
                  className="border rounded-lg px-4 py-2"
                >
                  <option>Flood</option>
                  <option>Fire</option>
                  <option>Earthquake</option>
                  <option>Storm</option>
                </select>
              </div>
              <textarea
                placeholder="Message"
                value={alertForm.message}
                onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 mt-4 min-h-[80px]"
                required
              />
              <div className="flex gap-4 mt-4">
                <select
                  value={alertForm.priority}
                  onChange={(e) => setAlertForm({ ...alertForm, priority: e.target.value })}
                  className="border rounded-lg px-4 py-2"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Post alert</button>
              </div>
            </form>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <h3 className="p-4 font-semibold text-slate-800">All alerts</h3>
              <ul className="divide-y">
                {alerts.map((a) => (
                  <li key={a._id} className="p-4 flex justify-between items-start">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-slate-600 text-sm">{a.message}</p>
                      <p className="text-slate-400 text-xs">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={() => deleteAlert(a._id)} className="text-red-600 text-sm hover:underline">Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <h3 className="p-4 font-semibold text-slate-800">Rescue requests – approve & assign</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3">Type / Priority</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="px-4 py-3">{r.disasterType} / {r.priority}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{r.description}</td>
                      <td className="px-4 py-3">{r.userId?.name} {r.userId?.phone && `(${r.userId.phone})`}</td>
                      <td className="px-4 py-3">{r.status}</td>
                      <td className="px-4 py-3">
                        {r.status === "Pending" && (
                          <button onClick={() => approveRequest(r._id)} className="text-amber-600 hover:underline text-sm mr-2">Approve</button>
                        )}
                        {(r.status === "Approved" || r.status === "Pending") && (
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v) assignVolunteer(r._id, v);
                            }}
                          >
                            <option value="">Assign volunteer</option>
                            {volunteers.map((v) => (
                              <option key={v._id} value={v.userId?._id}>{v.userId?.name} ({v.availability})</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.length === 0 && <p className="p-4 text-slate-500">No requests yet.</p>}
          </div>
        )}

        {tab === "volunteers" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <h3 className="p-4 font-semibold text-slate-800">Volunteer management</h3>
            <ul className="divide-y">
              {volunteers.map((v) => (
                <li key={v._id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{v.userId?.name}</p>
                    <p className="text-slate-600 text-sm">{v.userId?.email} {v.userId?.phone}</p>
                    <p className="text-slate-500 text-xs">Availability: {v.availability} | Skills: {v.skills?.join(", ") || "—"}</p>
                  </div>
                </li>
              ))}
            </ul>
            {volunteers.length === 0 && <p className="p-4 text-slate-500">No volunteers registered yet.</p>}
          </div>
        )}

        {tab === "shelters" && (
          <div className="space-y-6">
            <form onSubmit={createShelter} className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add shelter</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Name" value={shelterForm.name} onChange={(e) => setShelterForm({ ...shelterForm, name: e.target.value })} className="border rounded-lg px-4 py-2" required />
                <input placeholder="Address" value={shelterForm.address} onChange={(e) => setShelterForm({ ...shelterForm, address: e.target.value })} className="border rounded-lg px-4 py-2" required />
                <input type="number" step="any" placeholder="Latitude" value={shelterForm.lat} onChange={(e) => setShelterForm({ ...shelterForm, lat: e.target.value })} className="border rounded-lg px-4 py-2" />
                <input type="number" step="any" placeholder="Longitude" value={shelterForm.lng} onChange={(e) => setShelterForm({ ...shelterForm, lng: e.target.value })} className="border rounded-lg px-4 py-2" />
                <input type="number" placeholder="Capacity" value={shelterForm.capacity} onChange={(e) => setShelterForm({ ...shelterForm, capacity: e.target.value })} className="border rounded-lg px-4 py-2" />
                <input placeholder="Contact phone" value={shelterForm.contactPhone} onChange={(e) => setShelterForm({ ...shelterForm, contactPhone: e.target.value })} className="border rounded-lg px-4 py-2" />
              </div>
              <input placeholder="Facilities (comma-separated)" value={shelterForm.facilities} onChange={(e) => setShelterForm({ ...shelterForm, facilities: e.target.value })} className="w-full border rounded-lg px-4 py-2 mt-4" />
              <button type="submit" className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Add shelter</button>
            </form>
            <ul className="bg-white rounded-xl shadow divide-y">
              {shelters.map((s) => (
                <li key={s._id} className="p-4">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-slate-600 text-sm">{s.address} | {s.contactPhone}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "contacts" && (
          <div className="space-y-6">
            <form onSubmit={createContact} className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Add emergency contact</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="border rounded-lg px-4 py-2" required />
                <input placeholder="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="border rounded-lg px-4 py-2" required />
                <select value={contactForm.type} onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })} className="border rounded-lg px-4 py-2">
                  <option>Police</option>
                  <option>Fire</option>
                  <option>Ambulance</option>
                  <option>NDRF</option>
                  <option>Helpline</option>
                </select>
                <input placeholder="Area" value={contactForm.area} onChange={(e) => setContactForm({ ...contactForm, area: e.target.value })} className="border rounded-lg px-4 py-2" />
              </div>
              <button type="submit" className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Add contact</button>
            </form>
            <ul className="bg-white rounded-xl shadow divide-y">
              {contacts.map((c) => (
                <li key={c._id} className="p-4 flex justify-between">
                  <span className="font-medium">{c.type}: {c.name} – {c.phone}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, sub }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow text-center">
      <h2 className="text-slate-600 text-sm font-medium">{title}</h2>
      <p className="text-2xl font-bold text-red-600 mt-1">{value ?? 0}{sub ? ` ${sub}` : ""}</p>
    </div>
  );
}
