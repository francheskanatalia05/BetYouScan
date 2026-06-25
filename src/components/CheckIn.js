import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import Navbar from "./Navbar";

export default function CheckIn() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticketInfo, setTicketInfo] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function to check if event is today
  const isEventToday = (eventDate) => {
    if (!eventDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  const handleCheckIn = async () => {
    if (!ticketCode.trim()) {
      setMessage({ type: "error", text: "Please enter a ticket code" });
      return;
    }
    
    setLoading(true);
    setTicketInfo(null);
    setMessage(null);
    
    try {
      console.log("Searching for ticket code:", ticketCode.toUpperCase().trim());
      
      const ticketsQuery = query(
        collection(db, "tickets"),
        where("ticketCode", "==", ticketCode.toUpperCase().trim())
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      
      console.log("Found tickets:", ticketsSnapshot.size);
      
      if (ticketsSnapshot.empty) {
        const allTickets = await getDocs(collection(db, "tickets"));
        console.log("All tickets in DB:", allTickets.docs.map(doc => doc.data().ticketCode));
        
        setMessage({ type: "error", text: `Invalid ticket code: "${ticketCode}". Please check and try again.` });
        setLoading(false);
        return;
      }
      
      const ticketDoc = ticketsSnapshot.docs[0];
      const ticket = { id: ticketDoc.id, ...ticketDoc.data() };
      
      console.log("Found ticket:", ticket);
      
      // Check ticket status first
      if (ticket.status === "used") {
        setMessage({ type: "error", text: "This ticket has already been used for check-in!" });
        setLoading(false);
        return;
      } else if (ticket.status === "cancelled") {
        setMessage({ type: "error", text: "This ticket has been cancelled!" });
        setLoading(false);
        return;
      }
      
      // NEW: Check if event is today
      if (!isEventToday(ticket.eventDate)) {
        const today = new Date().toISOString().split('T')[0];
        const isPast = ticket.eventDate < today;
        
        if (isPast) {
          setMessage({ type: "error", text: `❌ This event (${ticket.eventDate}) has already passed. Check-in is only available on the day of the event.` });
        } else {
          setMessage({ type: "error", text: `📅 This event is on ${ticket.eventDate}. Check-in is only available on the day of the event. Please come back on the event day.` });
        }
        setLoading(false);
        return;
      }
      
      // If all checks pass, show the ticket
      setTicketInfo(ticket);
      setMessage({ type: "success", text: "✅ Ticket is valid! Ready for check-in." });
      
    } catch (error) {
      console.error("Error validating ticket:", error);
      setMessage({ type: "error", text: "Error validating ticket. Please try again." });
    } finally {
      setLoading(false);
    }
  };
  
  const confirmCheckIn = async () => {
    if (!ticketInfo) return;
    
    try {
      await updateDoc(doc(db, "tickets", ticketInfo.id), {
        status: "used",
        checkedInAt: new Date().toISOString(),
        checkedInBy: auth.currentUser?.email || "admin"
      });
      
      setMessage({ type: "success", text: `✅ Successfully checked in: ${ticketInfo.eventName}` });
      setTicketInfo(null);
      setTicketCode("");
    } catch (error) {
      console.error("Error during check-in:", error);
      setMessage({ type: "error", text: "Failed to complete check-in. Please try again." });
    }
  };
  
  return (
    <div className="checkin-page">
      <Navbar />
      
      <div className="checkin-container">
        <div className="checkin-card">
          <h1>Ticket Check-In</h1>
          <p>Scan or enter ticket code for validation</p>
          
          <div className="checkin-form">
            <div className="form-group">
              <label>Ticket Code</label>
              <input
                type="text"
                placeholder="Enter ticket code (e.g., TKT-123456-ABC123)"
                value={ticketCode}
                onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
              />
              <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
                Example: TKT-1734567890123-ABCD1234
              </small>
            </div>
            
            <button onClick={handleCheckIn} disabled={loading} className="btn-validate">
              {loading ? "Validating..." : "Validate Ticket"}
            </button>
          </div>
          
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {ticketInfo && (
            <div className="ticket-validation">
              <h2>Ticket Details</h2>
              <div className="validation-details">
                <div className="detail-row">
                  <strong>Event:</strong> {ticketInfo.eventName}
                </div>
                <div className="detail-row">
                  <strong>Date:</strong> {ticketInfo.eventDate} 
                  <span style={{ color: "#10b981", marginLeft: "0.5rem", fontWeight: "bold" }}>
                    ✅ TODAY
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Time:</strong> {ticketInfo.eventTime}
                </div>
                <div className="detail-row">
                  <strong>Venue:</strong> {ticketInfo.eventVenue}
                </div>
                <div className="detail-row">
                  <strong>Ticket Code:</strong> {ticketInfo.ticketCode}
                </div>
                <div className="detail-row">
                  <strong>Ticket Type:</strong> {ticketInfo.ticketType === "student" ? "🎓 Student" : "👤 Regular"}
                </div>
                {ticketInfo.department && ticketInfo.department !== "N/A" && (
                  <div className="detail-row">
                    <strong>Department:</strong> {ticketInfo.department}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className="status-active">✅ Active - Ready for Check-In</span>
                </div>
              </div>
              
              <button onClick={confirmCheckIn} className="btn-checkin">
                ✅ Confirm Check-In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}