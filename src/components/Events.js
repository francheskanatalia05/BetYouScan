import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navbar from "./Navbar";

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = ["all", "Concert", "Sports", "Academic", "Cultural", "Workshop"];

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

  // Real-time listener for events
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const eventsQuery = query(
      collection(db, "events"),
      where("date", ">=", today)
    );
    
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Filter events
  useEffect(() => {
    let filtered = [...events];
    
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }
    
    if (dateFilter) {
      filtered = filtered.filter(event => event.date === dateFilter);
    }
    
    setFilteredEvents(filtered);
  }, [events, searchTerm, categoryFilter, dateFilter]);

  const handleReserveTicket = (event) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login to reserve tickets");
      navigate("/login");
      return;
    }
    navigate("/checkout", { state: { event } });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading events...</div>
      </>
    );
  }

  return (
    <div className="events-page">
      <Navbar />
      
      <div className="tickets-container">
        <div className="tickets-header">
          <h1>AVAILABLE EVENTS</h1>
          <p>Browse and reserve tickets for upcoming campus events</p>
          {events.length === 0 && !loading && (
            <p style={{ color: "#990000", marginTop: "0.5rem" }}>
              No events available. Please check back later!
            </p>
          )}
        </div>
        
        {/* Search and Filter Section */}
        <div className="filters-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search events by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>Category:</label>
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-date"
              />
            </div>
            
            {(searchTerm || categoryFilter !== "all" || dateFilter) && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setDateFilter("");
                }}
                className="clear-filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {/* Events Grid with Images */}
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="no-events">
              <p>No events found matching your criteria.</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                {/* Event Image */}
                <div style={{ height: "200px", overflow: "hidden", background: "#990000", position: "relative" }}>
                  <img 
                    src={event.imageUrl || getPlaceholderImage(event.category)} 
                    alt={event.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    onError={(e) => {
                      e.target.src = getPlaceholderImage(event.category);
                    }}
                  />
                  <div style={{ 
                    position: "absolute", 
                    bottom: "0", 
                    left: "0", 
                    right: "0", 
                    background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    padding: "1rem",
                    color: "white"
                  }}>
                    <span className="event-category" style={{ background: "#990000", color: "white" }}>{event.category}</span>
                  </div>
                </div>
                
                <div className="event-details">
                  <h3>{event.name}</h3>
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-info">
                    <div className="info-item">
                      <span className="info-label">📅 Date:</span>
                      <span>{event.date}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">⏰ Time:</span>
                      <span>{event.time || "7:00 PM"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">📍 Venue:</span>
                      <span>{event.venue}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">🎟️ Available:</span>
                      <span className={event.availableTickets < 50 ? "low-stock" : ""}>
                        {event.availableTickets} tickets
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleReserveTicket(event)}
                    disabled={event.availableTickets === 0}
                    className="reserve-btn"
                    style={{ marginTop: "1rem" }}
                  >
                    {event.availableTickets === 0 ? "SOLD OUT" : "REQUEST INVITATION →"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}