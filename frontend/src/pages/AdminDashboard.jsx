import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import RescueMap from "../components/RescueMap";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("analytics");
  const [now, setNow] = useState(() => Date.now());
  const [stats, setStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [alertForm, setAlertForm] = useState({ title: "", message: "", disasterType: "Flood", priority: "High" });
  const [shelterForm, setShelterForm] = useState({ name: "", address: "", lat: "", lng: "", capacity: "", contactPhone: "", facilities: "" });
  const [contactForm, setContactForm] = useState({ name: "", phone: "", type: "Helpline", area: "" });

  // Shelter edit/delete modals
  const [isShelterModalOpen, setIsShelterModalOpen] = useState(false);
  const [shelterEdit, setShelterEdit] = useState(null); // { _id, name, address, location, capacity, contactPhone, facilities }
  const [shelterEditForm, setShelterEditForm] = useState({ name: "", address: "", lat: "", lng: "", capacity: "", contactPhone: "", facilities: "" });

  // Contact edit/delete modals
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactEdit, setContactEdit] = useState(null);
  const [contactEditForm, setContactEditForm] = useState({ name: "", phone: "", type: "Helpline", area: "" });

  // Confirm delete modal
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const fetchStats = () => axios.get("/admin/stats").then((r) => setStats(r.data));
  const fetchAlerts = () => axios.get("/alerts").then((r) => setAlerts(r.data));
  const fetchRequests = () => axios.get("/requests").then((r) => setRequests(r.data));
  const fetchVolunteers = () => axios.get("/volunteers").then((r) => setVolunteers(r.data));
  const fetchShelters = () => axios.get("/shelters").then((r) => setShelters(r.data));
  const fetchContacts = () => axios.get("/emergency-contacts").then((r) => setContacts(r.data));

  useEffect(() => {
    fetchStats();
  }, []);

  // Tick every second for countdown UIs
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (tab === "alerts") fetchAlerts();
    if (tab === "requests") {
      fetchRequests();
      fetchVolunteers();
    }
    if (tab === "map") fetchRequests();
    if (tab === "volunteers") fetchVolunteers();
    if (tab === "shelters") fetchShelters();
    if (tab === "contacts") fetchContacts();
  }, [tab]);

  // Real-time volunteer availability via Socket.io
  useEffect(() => {
    const onAvailability = ({ userId, isAvailable }) => {
      setVolunteers((prev) =>
        prev.map((v) =>
          v.userId?._id === userId
            ? { ...v, userId: { ...v.userId, isAvailable } }
            : v
        )
      );
    };
    socket.on("volunteerAvailability", onAvailability);
    return () => socket.off("volunteerAvailability", onAvailability);
  }, []);

  // Real-time new SOS / rescue request for map
  useEffect(() => {
    const onNewRescueRequest = (request) => {
      setRequests((prev) => [request, ...prev]);
    };
    socket.on("newRescueRequest", onNewRescueRequest);
    return () => socket.off("newRescueRequest", onNewRescueRequest);
  }, []);

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
    const res = await axios.put(`/requests/assign/${requestId}`, { volunteerId });
    setRequests((prev) => prev.map((r) => (r._id === requestId ? res.data : r)));
    fetchStats();
  };

  const undoAssignVolunteer = async (requestId) => {
    try {
      const res = await axios.put(`/requests/undo-assign/${requestId}`);
      setRequests((prev) => prev.map((r) => (r._id === requestId ? res.data : r)));
      fetchStats();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Undo failed");
      fetchRequests();
    }
  };

  const createShelter = async (e) => {
    e.preventDefault();
    const lat = Number(shelterForm.lat);
    const lng = Number(shelterForm.lng);
    await axios.post("/shelters", {
      name: shelterForm.name,
      address: shelterForm.address,
      location: { lat: Number.isFinite(lat) ? lat : 0, lng: Number.isFinite(lng) ? lng : 0 },
      capacity: Number(shelterForm.capacity) || 0,
      contactPhone: shelterForm.contactPhone || undefined,
      facilities: shelterForm.facilities ? shelterForm.facilities.split(",").map((s) => s.trim()).filter(Boolean) : []
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

  const openShelterEditModal = (s) => {
    setShelterEdit(s);
    setShelterEditForm({
      name: s.name || "",
      address: s.address || "",
      lat: s.location?.lat ?? "",
      lng: s.location?.lng ?? "",
      capacity: s.capacity ?? "",
      contactPhone: s.contactPhone || "",
      facilities: Array.isArray(s.facilities) ? s.facilities.join(", ") : ""
    });
    setIsShelterModalOpen(true);
  };

  const saveShelterEdit = async () => {
    if (!shelterEdit?._id) return;
    const lat = Number(shelterEditForm.lat);
    const lng = Number(shelterEditForm.lng);
    const payload = {
      name: shelterEditForm.name,
      address: shelterEditForm.address,
      location: { lat: Number.isFinite(lat) ? lat : 0, lng: Number.isFinite(lng) ? lng : 0 },
      capacity: Number(shelterEditForm.capacity) || 0,
      contactPhone: shelterEditForm.contactPhone || undefined,
      facilities: shelterEditForm.facilities
        ? shelterEditForm.facilities.split(",").map((x) => x.trim()).filter(Boolean)
        : []
    };
    const res = await axios.put(`/shelters/${shelterEdit._id}`, payload);
    setShelters((prev) => prev.map((x) => (x._id === shelterEdit._id ? res.data : x)));
    setIsShelterModalOpen(false);
    setShelterEdit(null);
  };

  const confirmDeleteShelter = (s) => {
    setConfirm({
      open: true,
      title: "Delete shelter?",
      message: `This will remove "${s.name}" from active shelters.`,
      onConfirm: async () => {
        await axios.delete(`/shelters/${s._id}`);
        setShelters((prev) => prev.filter((x) => x._id !== s._id));
        setConfirm({ open: false, title: "", message: "", onConfirm: null });
      }
    });
  };

  const openContactEditModal = (c) => {
    setContactEdit(c);
    setContactEditForm({
      name: c.name || "",
      phone: c.phone || "",
      type: c.type || "Helpline",
      area: c.area || ""
    });
    setIsContactModalOpen(true);
  };

  const saveContactEdit = async () => {
    if (!contactEdit?._id) return;
    const res = await axios.put(`/emergency-contacts/${contactEdit._id}`, contactEditForm);
    setContacts((prev) => prev.map((x) => (x._id === contactEdit._id ? res.data : x)));
    setIsContactModalOpen(false);
    setContactEdit(null);
  };

  const confirmDeleteContact = (c) => {
    setConfirm({
      open: true,
      title: "Delete emergency contact?",
      message: `This will remove "${c.type}: ${c.name}" from the directory.`,
      onConfirm: async () => {
        await axios.delete(`/emergency-contacts/${c._id}`);
        setContacts((prev) => prev.filter((x) => x._id !== c._id));
        setConfirm({ open: false, title: "", message: "", onConfirm: null });
      }
    });
  };

  const removeVolunteer = async (volunteerId, name) => {
    if (!confirm(`Remove volunteer "${name}"? They will no longer have volunteer access.`)) return;
    try {
      const res = await axios.delete(`/volunteers/${volunteerId}`);
      setVolunteers((prev) =>
        prev.map((v) =>
          v._id === volunteerId
            ? { ...v, pendingRemoval: true, removalUndoExpiresAt: res.data.undoExpiresAt }
            : v
        )
      );
    } catch (e) {
      console.error(e);
      alert("Failed to remove volunteer.");
    }
  };

  const undoRemoveVolunteer = async (volunteerId) => {
    try {
      const res = await axios.put(`/volunteers/${volunteerId}/undo-remove`);
      setVolunteers((prev) => prev.map((v) => (v._id === volunteerId ? res.data : v)));
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Undo failed");
      fetchVolunteers();
    }
  };

  const fmt = (s) => `${Math.max(0, Math.ceil(s))}s`;

  const requestUndoRemainingSeconds = (r) => {
    const exp = r?.assignmentUndoExpiresAt ? new Date(r.assignmentUndoExpiresAt).getTime() : 0;
    if (!exp) return 0;
    return Math.max(0, (exp - now) / 1000);
  };

  const volunteerUndoRemainingSeconds = (v) => {
    const exp = v?.removalUndoExpiresAt ? new Date(v.removalUndoExpiresAt).getTime() : 0;
    if (!exp) return 0;
    return Math.max(0, (exp - now) / 1000);
  };

  const rescueMapMarkers = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            r.location?.lat != null &&
            r.location?.lng != null &&
            Number.isFinite(r.location.lat) &&
            Number.isFinite(r.location.lng)
        )
        .map((r) => ({
          id: r._id,
          lat: r.location.lat,
          lng: r.location.lng,
          title: `${r.disasterType} – ${r.priority} (${r.status})`,
          description: r.description,
          phone: r.userId?.phone || r.phone
        })),
    [requests]
  );

  const tabs = [
    { id: "analytics", label: "Analytics" },
    { id: "map", label: "Rescue Map" },
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

        {tab === "map" && (
          <div className="bg-white rounded-xl shadow overflow-hidden p-4">
            <h3 className="font-semibold text-slate-800 mb-2">Live rescue map – SOS locations</h3>
            <p className="text-slate-600 text-sm mb-4">Citizen SOS locations appear here in real time. Use the Requests tab to approve and assign volunteers.</p>
            <RescueMap markers={rescueMapMarkers} height="480px" />
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
                        {r.status === "Assigned" && (
                          <div className="flex flex-wrap items-center gap-2">
                            {requestUndoRemainingSeconds(r) > 0 ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => undoAssignVolunteer(r._id)}
                                  className="text-slate-700 hover:bg-slate-100 px-2 py-1 rounded text-sm font-medium border"
                                >
                                  Undo ({fmt(requestUndoRemainingSeconds(r))})
                                </button>
                                <span className="text-xs text-slate-500">
                                  Final in {fmt(requestUndoRemainingSeconds(r))}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-500">Assignment final</span>
                            )}
                          </div>
                        )}
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
                              <option key={v._id} value={v.userId?._id}>
                                {v.userId?.name} ({v.userId?.isAvailable ? "Online" : "Offline"})
                              </option>
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
            <h3 className="p-4 font-semibold text-slate-800">Volunteer management (availability updates in real time)</h3>
            <ul className="divide-y">
              {volunteers.map((v) => (
                <li key={v._id} className="p-4 flex justify-between items-center gap-4">
                  <div>
                    <p className="font-medium">{v.userId?.name}</p>
                    <p className="text-slate-600 text-sm">{v.userId?.email} {v.userId?.phone}</p>
                    <p className="text-slate-500 text-xs">Skills: {v.skills?.join(", ") || "—"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${v.userId?.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${v.userId?.isAvailable ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {v.userId?.isAvailable ? "Online" : "Offline"}
                    </span>
                    {v.pendingRemoval && volunteerUndoRemainingSeconds(v) > 0 ? (
                      <button
                        type="button"
                        onClick={() => undoRemoveVolunteer(v._id)}
                        className="text-slate-700 hover:bg-slate-100 px-2 py-1 rounded text-sm font-medium border"
                      >
                        Undo ({fmt(volunteerUndoRemainingSeconds(v))})
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeVolunteer(v._id, v.userId?.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
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
                <li key={s._id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-slate-600 text-sm">{s.address}{s.contactPhone ? ` | ${s.contactPhone}` : ""}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Lat/Lng: {s.location?.lat ?? 0}, {s.location?.lng ?? 0} · Capacity: {s.capacity ?? 0}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openShelterEditModal(s)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteShelter(s)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
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
                <li key={c._id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{c.type}: {c.name}</p>
                    <p className="text-slate-600 text-sm">{c.phone}{c.area ? ` · ${c.area}` : ""}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openContactEditModal(c)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteContact(c)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modals */}
        <Modal
          open={isShelterModalOpen}
          title="Edit shelter"
          onClose={() => {
            setIsShelterModalOpen(false);
            setShelterEdit(null);
          }}
          onSave={saveShelterEdit}
          saveLabel="Save changes"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.name} onChange={(e) => setShelterEditForm({ ...shelterEditForm, name: e.target.value })} />
            </Field>
            <Field label="Address">
              <input className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.address} onChange={(e) => setShelterEditForm({ ...shelterEditForm, address: e.target.value })} />
            </Field>
            <Field label="Latitude">
              <input type="number" step="any" className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.lat} onChange={(e) => setShelterEditForm({ ...shelterEditForm, lat: e.target.value })} />
            </Field>
            <Field label="Longitude">
              <input type="number" step="any" className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.lng} onChange={(e) => setShelterEditForm({ ...shelterEditForm, lng: e.target.value })} />
            </Field>
            <Field label="Capacity">
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.capacity} onChange={(e) => setShelterEditForm({ ...shelterEditForm, capacity: e.target.value })} />
            </Field>
            <Field label="Contact phone">
              <input className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.contactPhone} onChange={(e) => setShelterEditForm({ ...shelterEditForm, contactPhone: e.target.value })} />
            </Field>
          </div>
          <Field label="Facilities (comma-separated)">
            <input className="w-full border rounded-lg px-3 py-2" value={shelterEditForm.facilities} onChange={(e) => setShelterEditForm({ ...shelterEditForm, facilities: e.target.value })} />
          </Field>
        </Modal>

        <Modal
          open={isContactModalOpen}
          title="Edit emergency contact"
          onClose={() => {
            setIsContactModalOpen(false);
            setContactEdit(null);
          }}
          onSave={saveContactEdit}
          saveLabel="Save changes"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Type">
              <select className="w-full border rounded-lg px-3 py-2" value={contactEditForm.type} onChange={(e) => setContactEditForm({ ...contactEditForm, type: e.target.value })}>
                <option>Police</option>
                <option>Fire</option>
                <option>Ambulance</option>
                <option>NDRF</option>
                <option>Helpline</option>
              </select>
            </Field>
            <Field label="Area">
              <input className="w-full border rounded-lg px-3 py-2" value={contactEditForm.area} onChange={(e) => setContactEditForm({ ...contactEditForm, area: e.target.value })} />
            </Field>
            <Field label="Name">
              <input className="w-full border rounded-lg px-3 py-2" value={contactEditForm.name} onChange={(e) => setContactEditForm({ ...contactEditForm, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="w-full border rounded-lg px-3 py-2" value={contactEditForm.phone} onChange={(e) => setContactEditForm({ ...contactEditForm, phone: e.target.value })} />
            </Field>
          </div>
        </Modal>

        <ConfirmModal
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          onCancel={() => setConfirm({ open: false, title: "", message: "", onConfirm: null })}
          onConfirm={async () => {
            try {
              await confirm.onConfirm?.();
            } catch (e) {
              console.error(e);
              alert(e.response?.data?.message || "Action failed");
              setConfirm({ open: false, title: "", message: "", onConfirm: null });
            }
          }}
        />
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Modal({ open, title, children, onClose, onSave, saveLabel = "Save" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-slate-50">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border">
        <div className="p-5 border-b">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-slate-600 text-sm">{message}</p>
        </div>
        <div className="p-5 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}
