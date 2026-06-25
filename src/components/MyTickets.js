import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Navbar from "./Navbar";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [stats, setStats] = useState({
    active: 0,
    used: 0,
    cancelled: 0,
    total: 0
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Real-time listener for user's tickets
    const ticketsQuery = query(
      collection(db, "tickets"),
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
      const ticketsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTickets(ticketsList);
      
      // Calculate stats
      const active = ticketsList.filter(t => t.status === "active").length;
      const used = ticketsList.filter(t => t.status === "used").length;
      const cancelled = ticketsList.filter(t => t.status === "cancelled").length;
      
      setStats({
        active,
        used,
        cancelled,
        total: ticketsList.length
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tickets:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "TBD";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#10b981';
      case 'used': return '#6c757d';
      case 'cancelled': return '#dc2626';
      default: return '#666';
    }
  };

  // Check if ticket is valid for today (event date equals today's date)
  const isEventToday = (ticket) => {
    if (!ticket.eventDate) return false;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Compare the date part only
    return ticket.eventDate === todayStr;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading your tickets...</div>
      </>
    );
  }

  return (
    <div className="my-tickets-page">
      <Navbar />
      
      <div className="tickets-container">
        <div className="tickets-header">
          <h1>MY TICKETS</h1>
          <p>View and manage all your event tickets</p>
        </div>
        
        {/* Ticket Statistics Cards */}
        <div className="tickets-stats-grid">
          <div className="ticket-stat-card active-stat">
            <div className="stat-number">{stats.active}</div>
            <div className="stat-label">ACTIVE TICKETS</div>
            <div className="stat-icon">🎫</div>
          </div>
          <div className="ticket-stat-card used-stat">
            <div className="stat-number">{stats.used}</div>
            <div className="stat-label">USED TICKETS</div>
            <div className="stat-icon">✓</div>
          </div>
          <div className="ticket-stat-card cancelled-stat">
            <div className="stat-number">{stats.cancelled}</div>
            <div className="stat-label">CANCELLED</div>
            <div className="stat-icon">✗</div>
          </div>
          <div className="ticket-stat-card total-stat">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">TOTAL TICKETS</div>
            <div className="stat-icon">📊</div>
          </div>
        </div>
        
        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="no-tickets">
            <div className="no-tickets-icon">🎟️</div>
            <p>You haven't reserved any tickets yet.</p>
            <button onClick={() => window.location.href = "/events"} className="btn-primary">
              BROWSE EVENTS
            </button>
          </div>
        ) : (
          <div className="tickets-grid-full">
            {tickets.map(ticket => {
              const eventToday = isEventToday(ticket);
              const canCheckIn = ticket.status === "active" && eventToday;
              const isPastEvent = ticket.status === "active" && !eventToday && ticket.eventDate && ticket.eventDate < new Date().toISOString().split('T')[0];
              
              return (
                <div key={ticket.id} className={`ticket-card-full ${ticket.status}`}>
                  <div className="ticket-card-left">
                    <div className="ticket-event-icon">🎟️</div>
                    <div className="ticket-vertical-line"></div>
                    <div className="ticket-event-date">
                      <div className="date-day">{ticket.eventDate?.split('-')[2]}</div>
                      <div className="date-month">
                        {ticket.eventDate?.split('-')[1] === '01' ? 'JAN' :
                         ticket.eventDate?.split('-')[1] === '02' ? 'FEB' :
                         ticket.eventDate?.split('-')[1] === '03' ? 'MAR' :
                         ticket.eventDate?.split('-')[1] === '04' ? 'APR' :
                         ticket.eventDate?.split('-')[1] === '05' ? 'MAY' :
                         ticket.eventDate?.split('-')[1] === '06' ? 'JUN' :
                         ticket.eventDate?.split('-')[1] === '07' ? 'JUL' :
                         ticket.eventDate?.split('-')[1] === '08' ? 'AUG' :
                         ticket.eventDate?.split('-')[1] === '09' ? 'SEP' :
                         ticket.eventDate?.split('-')[1] === '10' ? 'OCT' :
                         ticket.eventDate?.split('-')[1] === '11' ? 'NOV' : 'DEC'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ticket-card-middle">
                    <h3 className="ticket-event-name">{ticket.eventName}</h3>
                    <div className="ticket-details-list">
                      <div className="ticket-detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(ticket.eventDate)}</span>
                      </div>
                      <div className="ticket-detail-item">
                        <span className="detail-icon">⏰</span>
                        <span>{ticket.eventTime || "7:00 PM"}</span>
                      </div>
                      <div className="ticket-detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{ticket.eventVenue}</span>
                      </div>
                      <div className="ticket-detail-item">
                        <span className="detail-icon">🔑</span>
                        <span className="ticket-code-value">{ticket.ticketCode}</span>
                      </div>
                      {ticket.ticketType && (
                        <div className="ticket-detail-item">
                          <span className="detail-icon">🎫</span>
                          <span>{ticket.ticketType === "student" ? "🎓 Student Ticket" : "👤 Regular Ticket"}</span>
                        </div>
                      )}
                      {ticket.department && ticket.department !== "N/A" && (
                        <div className="ticket-detail-item">
                          <span className="detail-icon">🏛️</span>
                          <span>{ticket.department}</span>
                        </div>
                      )}
                      {ticket.amount && ticket.amount !== "Free" && (
                        <div className="ticket-detail-item">
                          <span className="detail-icon">💰</span>
                          <span>{ticket.amount}</span>
                        </div>
                      )}
                      {/* Show event status indicator */}
                      {ticket.status === "active" && (
                        <div className="ticket-detail-item" style={{ gridColumn: "span 2", marginTop: "0.25rem" }}>
                          <span className="detail-icon">📌</span>
                          <span style={{ 
                            color: eventToday ? "#10b981" : isPastEvent ? "#dc2626" : "#f59e0b",
                            fontWeight: "bold",
                            fontSize: "0.7rem"
                          }}>
                            {eventToday ? "✅ Event is TODAY - Ready for check-in" : 
                             isPastEvent ? "❌ Event has passed" : 
                             "📅 Coming soon"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ticket-card-right">
                    <div className="ticket-status" style={{ background: getStatusColor(ticket.status) }}>
                      {ticket.status?.toUpperCase()}
                    </div>
                    <div className="ticket-reserved-date">
                      Reserved: {formatDate(ticket.reservedAt)}
                    </div>
                    {ticket.status === "active" && canCheckIn && (
                      <button 
                        onClick={() => setSelectedTicket(ticket.id)}
                        className="ticket-action-btn view-qr-btn"
                      >
                        VIEW QR CODE
                      </button>
                    )}
                    {ticket.status === "active" && !canCheckIn && (
                      <div className="ticket-used-badge" style={{ background: "#f59e0b" }}>
                        {isPastEvent ? "📅 Event Passed" : "⏳ Wait for Event Day"}
                      </div>
                    )}
                    {ticket.status === "used" && (
                      <div className="ticket-used-badge">
                        ✓ Checked In on {formatDate(ticket.checkedInAt)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* QR Modal */}
      {selectedTicket && (
        <div className="modal" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setSelectedTicket(null)}>&times;</span>
            <h3>YOUR TICKET QR CODE</h3>
            {tickets.find(t => t.id === selectedTicket) && (
              <>
                <div className="qr-code-container">
                  {(() => {
                    const ticket = tickets.find(t => t.id === selectedTicket);
                    return (
                      <>
                        <div className="qr-code-simulator">
                          <div className="qr-squares">
                            <div className="qr-corner qr-tl"></div>
                            <div className="qr-corner qr-tr"></div>
                            <div className="qr-corner qr-bl"></div>
                            <div className="qr-inner-pattern"></div>
                          </div>
                          <div className="qr-code-text">{ticket?.ticketCode}</div>
                        </div>
                        <p className="ticket-code-display">{ticket?.ticketCode}</p>
                        <p className="qr-instruction">Present this QR code at the event entrance for scanning.</p>
                        <div className="ticket-event-info-modal">
                          <p><strong>{ticket?.eventName}</strong></p>
                          <p>{ticket?.eventDate} | {ticket?.eventTime}</p>
                          <p>{ticket?.eventVenue}</p>
                          {ticket?.ticketType && <p>Ticket Type: {ticket.ticketType === "student" ? "🎓 Student" : "👤 Regular"}</p>}
                          {ticket?.department && ticket.department !== "N/A" && <p>Department: {ticket.department}</p>}
                          {ticket?.amount && ticket.amount !== "Free" && <p>Amount: {ticket.amount}</p>}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}