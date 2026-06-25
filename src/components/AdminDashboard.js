import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [activeTab, setActiveTab] = useState("events"); // 'events', 'students', 'tickets'
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    category: "",
    availableTickets: "",
    priceType: "free",
    studentPrice: "",
    outsiderPrice: "",
    imageUrl: ""
  });

  // Get admin name
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setAdminName(user.displayName || user.email);
    }
  }, []);

  // Real-time listeners
  useEffect(() => {
    const unsubscribeEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsList);
    });

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    });

    const unsubscribeTickets = onSnapshot(collection(db, "tickets"), (snapshot) => {
      const ticketsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketsList);
      setLoading(false);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeUsers();
      unsubscribeTickets();
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePriceTypeChange = (type) => {
    setFormData({
      ...formData,
      priceType: type,
      studentPrice: type === "free" ? "Free" : "",
      outsiderPrice: type === "free" ? "Free" : ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date || !formData.venue || !formData.availableTickets) {
      alert("Please fill in all required fields!");
      return;
    }
    
    let studentPriceDisplay = "Free";
    let outsiderPriceDisplay = "Free";
    let studentPriceValue = 0;
    let outsiderPriceValue = 0;
    
    if (formData.priceType === "paid") {
      studentPriceDisplay = `₱${parseInt(formData.studentPrice).toLocaleString()}`;
      outsiderPriceDisplay = `₱${parseInt(formData.outsiderPrice).toLocaleString()}`;
      studentPriceValue = parseInt(formData.studentPrice) || 0;
      outsiderPriceValue = parseInt(formData.outsiderPrice) || 0;
    }
    
    try {
      const eventData = {
        name: formData.name,
        description: formData.description || "",
        date: formData.date,
        time: formData.time || "",
        venue: formData.venue,
        category: formData.category || "",
        availableTickets: parseInt(formData.availableTickets),
        priceType: formData.priceType,
        studentPrice: studentPriceDisplay,
        outsiderPrice: outsiderPriceDisplay,
        studentPriceValue: studentPriceValue,
        outsiderPriceValue: outsiderPriceValue,
        imageUrl: formData.imageUrl || "",
        status: "active",
        updatedAt: new Date().toISOString()
      };
      
      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), eventData);
        alert("Event updated successfully!");
      } else {
        eventData.createdAt = new Date().toISOString();
        eventData.createdBy = adminName;
        await addDoc(collection(db, "events"), eventData);
        alert("Event added successfully! Students can now see it.");
      }
      
      setShowEventForm(false);
      setEditingEvent(null);
      setFormData({
        name: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        category: "",
        availableTickets: "",
        priceType: "free",
        studentPrice: "",
        outsiderPrice: "",
        imageUrl: ""
      });
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event. Please try again.");
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || "",
      date: event.date,
      time: event.time || "",
      venue: event.venue,
      category: event.category || "",
      availableTickets: event.availableTickets,
      priceType: event.priceType || (event.price === "Free" ? "free" : "paid"),
      studentPrice: event.studentPriceValue || "",
      outsiderPrice: event.outsiderPriceValue || "",
      imageUrl: event.imageUrl || ""
    });
    setShowEventForm(true);
    setActiveTab("events");
  };

  const handleDelete = async (event) => {
    const ticketCount = tickets.filter(t => t.eventId === event.id).length;
    
    if (window.confirm(
      `⚠️ WARNING: You are about to delete "${event.name}"\n\n` +
      `This will also DELETE ${ticketCount} ticket(s) associated with this event.\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Click OK to permanently delete this event and all its tickets.`
    )) {
      try {
        const eventTickets = tickets.filter(ticket => ticket.eventId === event.id);
        for (const ticket of eventTickets) {
          await deleteDoc(doc(db, "tickets", ticket.id));
        }
        await deleteDoc(doc(db, "events", event.id));
        alert(`✅ Event "${event.name}" deleted successfully!\n📋 ${eventTickets.length} ticket(s) have been permanently deleted.`);
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event. Please try again.");
      }
    }
  };

  const exportToCSV = () => {
    if (tickets.length === 0) {
      alert("No tickets to export!");
      return;
    }

    const headers = [
      "Event Name", "Ticket Code", "Ticket Type", "Amount", "Department",
      "Status", "Reserved Date", "Checked In Date", "Payment Method", "User ID"
    ];
    
    const rows = tickets.map(ticket => [
      `"${ticket.eventName || ""}"`,
      `"${ticket.ticketCode || ""}"`,
      `"${ticket.ticketType === "student" ? "Student" : "Regular"}"`,
      `"${ticket.amount || "Free"}"`,
      `"${ticket.department || "N/A"}"`,
      `"${ticket.status?.toUpperCase() || ""}"`,
      `"${ticket.reservedAt ? new Date(ticket.reservedAt).toLocaleString() : ""}"`,
      `"${ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString() : "Not checked in"}"`,
      `"${ticket.paymentMethod || "N/A"}"`,
      `"${ticket.userId || ""}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `tickets_export_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✅ Exported ${tickets.length} tickets to CSV file!`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const getPlaceholderImage = (category) => {
    const images = {
      Concert: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=200&fit=crop",
      Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=200&fit=crop",
      Academic: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=200&fit=crop",
      Cultural: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=200&fit=crop",
      Workshop: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=200&fit=crop"
    };
    return images[category] || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=200&fit=crop";
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">BYS | ADMIN</div>
          <ul className="nav-links">
            <li><button onClick={handleLogout} className="logout-btn">LOGOUT</button></li>
          </ul>
        </div>
      </nav>
      
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {adminName}! Manage events, users, and tickets</p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{events.length}</h3>
              <p>Total Events</p>
            </div>
            <div className="stat-card">
              <h3>{users.filter(u => u.role === "student").length}</h3>
              <p>Student Users</p>
            </div>
            <div className="stat-card">
              <h3>{tickets.filter(t => t.status === "active").length}</h3>
              <p>Active Tickets</p>
            </div>
            <div className="stat-card">
              <h3>{tickets.filter(t => t.status === "used").length}</h3>
              <p>Checked In</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            📅 Events ({events.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            👨‍🎓 Students ({users.filter(u => u.role === "student").length})
          </button>
          <button 
            className={`admin-tab ${activeTab === "tickets" ? "active" : ""}`}
            onClick={() => setActiveTab("tickets")}
          >
            🎟️ Tickets ({tickets.length})
          </button>
        </div>

        {/* ========== EVENTS TAB ========== */}
        {activeTab === "events" && (
          <div className="admin-tab-content">
            <div className="quick-actions">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2>Manage Events</h2>
                <button 
                  onClick={() => {
                    setEditingEvent(null);
                    setFormData({
                      name: "",
                      description: "",
                      date: "",
                      time: "",
                      venue: "",
                      category: "",
                      availableTickets: "",
                      priceType: "free",
                      studentPrice: "",
                      outsiderPrice: "",
                      imageUrl: ""
                    });
                    setShowEventForm(!showEventForm);
                  }} 
                  className="btn-primary" 
                  style={{ width: "auto" }}
                >
                  {showEventForm ? "Cancel" : "+ Create New Event"}
                </button>
              </div>

              {showEventForm && (
                <form onSubmit={handleSubmit} style={{ background: "#f5f5f5", padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid #ddd" }}>
                  <h3 style={{ marginBottom: "1rem", color: "#990000" }}>
                    {editingEvent ? "✏️ Edit Event" : "➕ Create New Event"}
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label>Event Image URL (optional)</label>
                      <input 
                        type="text" 
                        name="imageUrl" 
                        value={formData.imageUrl} 
                        onChange={handleChange} 
                        placeholder="Paste image URL from Unsplash, Pexels, etc."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Event Name *</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="e.g., LPU Cultural Festival 2024"
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Category *</label>
                      <select name="category" value={formData.category} onChange={handleChange} required>
                        <option value="">Select Category</option>
                        <option value="Concert">Concert</option>
                        <option value="Sports">Sports</option>
                        <option value="Academic">Academic</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Workshop">Workshop</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Date *</label>
                      <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                      <label>Time *</label>
                      <input type="time" name="time" value={formData.time} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                      <label>Venue *</label>
                      <input type="text" name="venue" value={formData.venue} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                      <label>Available Tickets *</label>
                      <input type="number" name="availableTickets" value={formData.availableTickets} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label>Ticket Pricing *</label>
                      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                          <input type="radio" name="priceType" value="free" checked={formData.priceType === "free"} onChange={() => handlePriceTypeChange("free")} />
                          Free Event
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                          <input type="radio" name="priceType" value="paid" checked={formData.priceType === "paid"} onChange={() => handlePriceTypeChange("paid")} />
                          Paid Event
                        </label>
                      </div>
                      
                      {formData.priceType === "paid" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div>
                            <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#990000" }}>🎓 Student Price</label>
                            <input type="number" name="studentPrice" placeholder="e.g., 250" value={formData.studentPrice} onChange={handleChange} required />
                          </div>
                          <div>
                            <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#666" }}>👤 Regular Price</label>
                            <input type="number" name="outsiderPrice" placeholder="e.g., 500" value={formData.outsiderPrice} onChange={handleChange} required />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: "span 2" }}>
                      <label>Description</label>
                      <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="Describe the event..." />
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button type="submit" className="btn-primary" style={{ width: "auto", padding: "0.75rem 2rem" }}>
                      {editingEvent ? "Update Event" : "Publish Event"}
                    </button>
                    <button type="button" onClick={() => setShowEventForm(false)} className="btn-secondary" style={{ width: "auto" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="events-grid">
                {events.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", background: "#f5f5f5" }}>
                    <p>No events yet. Click "Create New Event" to add your first event!</p>
                  </div>
                ) : (
                  events.map(event => {
                    const ticketCount = tickets.filter(t => t.eventId === event.id).length;
                    return (
                      <div key={event.id} className="event-card">
                        <div style={{ height: "180px", overflow: "hidden", background: "#990000", position: "relative" }}>
                          <img src={event.imageUrl || getPlaceholderImage(event.category)} alt={event.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            onError={(e) => { e.target.src = getPlaceholderImage(event.category); }} />
                          <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.7)", color: "white", padding: "4px 8px", fontSize: "0.7rem", fontWeight: "bold" }}>
                            {event.priceType === "free" ? "FREE" : `🎓 ${event.studentPrice}`}
                          </div>
                        </div>
                        <div className="event-details">
                          <h3>{event.name}</h3>
                          <span className="event-category">{event.category}</span>
                          <div className="event-info">
                            <div className="info-item"><span className="info-label">📅 Date:</span><span>{event.date}</span></div>
                            <div className="info-item"><span className="info-label">📍 Venue:</span><span>{event.venue}</span></div>
                            <div className="info-item"><span className="info-label">🎟️ Available:</span><span>{event.availableTickets} tickets</span></div>
                            <div className="info-item"><span className="info-label">📋 Reserved:</span><span>{ticketCount} tickets</span></div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                            <button onClick={() => handleEdit(event)} className="btn-view-qr">Edit</button>
                            <button onClick={() => handleDelete(event)} className="btn-cancel">Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== STUDENTS TAB ========== */}
        {activeTab === "students" && (
          <div className="admin-tab-content">
            <div className="quick-actions">
              <h2>Registered Students</h2>
              <div className="tickets-list">
                {users.filter(u => u.role === "student").length === 0 ? (
                  <p>No students registered yet.</p>
                ) : (
                  users.filter(u => u.role === "student").map(user => (
                    <div key={user.id} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                      <div>
                        <p><strong>{user.name}</strong></p>
                        <p style={{ fontSize: "0.8rem", color: "#666" }}>{user.email}</p>
                        <p style={{ fontSize: "0.7rem", color: "#999" }}>Student ID: {user.studentId} | Department: {user.department || "N/A"}</p>
                      </div>
                      <div>
                        <span style={{ background: "#10b981", color: "white", padding: "2px 8px", fontSize: "0.7rem" }}>
                          Registered: {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== TICKETS TAB ========== */}
        {activeTab === "tickets" && (
          <div className="admin-tab-content">
            <div className="quick-actions">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2>Ticket Reservations ({tickets.length})</h2>
                {tickets.length > 0 && (
                  <button onClick={exportToCSV} className="btn-primary" style={{ width: "auto", padding: "0.5rem 1rem" }}>
                    📥 Export to CSV
                  </button>
                )}
              </div>
              
              {/* Ticket Stats Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "#f5f5f5", padding: "1rem", textAlign: "center", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}>{tickets.filter(t => t.status === "active").length}</div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>Active</div>
                </div>
                <div style={{ background: "#f5f5f5", padding: "1rem", textAlign: "center", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#6c757d" }}>{tickets.filter(t => t.status === "used").length}</div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>Checked In</div>
                </div>
                <div style={{ background: "#f5f5f5", padding: "1rem", textAlign: "center", border: "1px solid #ddd" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#990000" }}>{tickets.filter(t => t.ticketType === "student").length} / {tickets.filter(t => t.ticketType === "outsider" || t.ticketType === "regular").length}</div>
                  <div style={{ fontSize: "0.7rem", color: "#666" }}>Student / Regular</div>
                </div>
              </div>
              
              <div className="tickets-list">
                {tickets.length === 0 ? (
                  <p>No ticket reservations yet.</p>
                ) : (
                  tickets.slice().reverse().map(ticket => (
                    <div key={ticket.id} style={{ border: "1px solid #ddd", padding: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div>
                          <p><strong>{ticket.eventName}</strong></p>
                          <p style={{ fontSize: "0.8rem", color: "#666" }}>🎟️ {ticket.ticketCode}</p>
                          <p style={{ fontSize: "0.7rem", color: "#999" }}>Ticket Type: {ticket.ticketType === "student" ? "🎓 Student" : "👤 Regular"} | Department: {ticket.department || "N/A"}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ 
                            background: ticket.status === "active" ? "#10b981" : ticket.status === "used" ? "#6c757d" : "#dc2626", 
                            color: "white", padding: "2px 8px", fontSize: "0.7rem", display: "inline-block"
                          }}>
                            {ticket.status?.toUpperCase()}
                          </span>
                          <p style={{ fontSize: "0.7rem", color: "#999", marginTop: "0.25rem" }}>📅 {new Date(ticket.reservedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}