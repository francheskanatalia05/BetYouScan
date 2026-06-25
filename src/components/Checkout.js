import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, addDoc, collection, getDoc } from "firebase/firestore";
import Navbar from "./Navbar";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { event } = location.state || {};
  
  const [ticketType, setTicketType] = useState("student");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!event) {
      navigate("/events");
    }
    
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCardholderName(userDoc.data().name);
        }
      }
    };
    fetchUserData();
  }, [event, navigate]);

  const handleConfirmCheckout = async () => {
    if (ticketType === "student" && !department) {
      alert("Please select your department");
      return;
    }
    
    if (!cardholderName || !cardNumber) {
      alert("Please enter payment details");
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please login to complete checkout");
        navigate("/login");
        return;
      }
      
      const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      
      let amount = "Free";
      if (event.priceType === "paid") {
        amount = ticketType === "student" ? event.studentPrice : event.outsiderPrice;
      }
      
      await addDoc(collection(db, "tickets"), {
        userId: user.uid,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time || "7:00 PM",
        eventVenue: event.venue,
        ticketCode: ticketCode,
        status: "active",
        ticketType: ticketType,
        paymentMethod: paymentMethod,
        amount: amount,
        department: ticketType === "student" ? department : "N/A",
        reservedAt: new Date().toISOString()
      });
      
      alert(`Ticket reserved successfully!\nTicket Code: ${ticketCode}\nTicket Type: ${ticketType.toUpperCase()}\nAmount: ${amount}`);
      navigate("/my-tickets");
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to complete checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading...</div>
      </>
    );
  }

  const getStudentPrice = () => {
    if (event.priceType === "free") return "Free";
    return event.studentPrice || "Free";
  };

  const getRegularPrice = () => {
    if (event.priceType === "free") return "Free";
    return event.outsiderPrice || "Free";
  };

  return (
    <div className="checkout-page">
      <Navbar />
      
      <div className="checkout-container">
        <div className="tickets-header">
          <h1>CHECKOUT</h1>
          <p>Finalize your institutional reservation</p>
        </div>
        
        <div className="checkout-grid">
          <div>
            <div className="checkout-section">
              <h2>TICKET TYPE</h2>
              <div className="ticket-type-options">
                <div 
                  className={`ticket-type-option ${ticketType === "student" ? "selected" : ""}`}
                  onClick={() => setTicketType("student")}
                >
                  <div className="ticket-type-icon">🎓</div>
                  <div className="ticket-type-name">Student</div>
                  <div className="ticket-type-price">{getStudentPrice()}</div>
                  <div className="ticket-type-note">Valid student ID required</div>
                </div>
                <div 
                  className={`ticket-type-option ${ticketType === "outsider" ? "selected" : ""}`}
                  onClick={() => setTicketType("outsider")}
                >
                  <div className="ticket-type-icon">👤</div>
                  <div className="ticket-type-name">Regular</div>
                  <div className="ticket-type-price">{getRegularPrice()}</div>
                  <div className="ticket-type-note">General admission</div>
                </div>
              </div>
            </div>

            {ticketType === "student" && (
              <div className="checkout-section" style={{ marginTop: "1.5rem" }}>
                <h2>DEPARTMENT</h2>
                <div className="form-group">
                  <label>Select your department</label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.75rem", background: "white", border: "1px solid #ddd" }}
                  >
                    <option value="">Select Department</option>
                    <option value="BSIT">BS Information Technology</option>
                    <option value="BSCS">BS Computer Science</option>
                    <option value="BSIS">BS Information Systems</option>
                    <option value="BSBA">BS Business Administration</option>
                    <option value="BSHM">BS Hospitality Management</option>
                    <option value="BSTM">BS Tourism Management</option>
                    <option value="BSA">BS Accountancy</option>
                    <option value="BSEE">BS Electrical Engineering</option>
                    <option value="BSCE">BS Civil Engineering</option>
                    <option value="BSME">BS Mechanical Engineering</option>
                    <option value="BSN">BS Nursing</option>
                    <option value="BSPsych">BS Psychology</option>
                    <option value="BSEd">BS Education</option>
                    <option value="ABComm">AB Communication</option>
                    <option value="Other">Other Department</option>
                  </select>
                </div>
              </div>
            )}
            
            <div className="checkout-section" style={{ marginTop: "1.5rem" }}>
              <h2>SEATING ARRANGEMENT</h2>
              <div className="free-seating-info">
                <div className="stage">STAGE / PULPIT</div>
                <div className="free-seating-message">
                  <div className="free-seating-icon">🪑</div>
                  <div className="free-seating-text">
                    <strong>FREE SEATING</strong>
                    <p>First come, first served basis. No reserved seats.</p>
                    <small>Arrive early to get the best available seats.</small>
                  </div>
                </div>
                <div className="seating-note">
                  📍 Venue: {event.venue} 
                </div>
              </div>
            </div>
            
            <div className="checkout-section" style={{ marginTop: "1.5rem" }}>
              <h2>PAYMENT METHOD</h2>
              
              <div className="payment-options">
                <div 
                  className={`payment-option ${paymentMethod === 'gcash' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('gcash')}
                >
                  <span style={{ fontSize: "1.2rem" }}>📱</span> GCASH
                </div>
                <div 
                  className={`payment-option ${paymentMethod === 'credit_card' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('credit_card')}
                >
                  <span style={{ fontSize: "1.2rem" }}>💳</span> CREDIT CARD
                </div>
                <div 
                  className={`payment-option ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <span style={{ fontSize: "1.2rem" }}>🏦</span> BANK TRANSFER
                </div>
              </div>
              
              <div className="form-group">
                <label>ACCOUNT HOLDER NAME</label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>REFERENCE NUMBER / ACCOUNT NUMBER</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Enter reference or account number"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="order-summary">
            <h2>ORDER SUMMARY</h2>
            
            <div className="summary-item">
              <span>{event.name}</span>
              <span></span>
            </div>
            <div className="summary-item">
              <span>Date & Time</span>
              <span>{event.date} | {event.time || "7:00 PM"}</span>
            </div>
            <div className="summary-item">
              <span>Venue</span>
              <span>{event.venue}</span>
            </div>
            <div className="summary-item">
              <span>Ticket Type</span>
              <span>{ticketType === "student" ? "🎓 Student" : "👤 Regular"}</span>
            </div>
            {ticketType === "student" && department && (
              <div className="summary-item">
                <span>Department</span>
                <span>{department}</span>
              </div>
            )}
            <div className="summary-item">
              <span>Seating</span>
              <span>Free Seating (First come, first served)</span>
            </div>
            <div className="summary-item">
              <span>Payment Method</span>
              <span>{paymentMethod === 'gcash' ? '📱 GCASH' : paymentMethod === 'credit_card' ? '💳 CREDIT CARD' : '🏦 BANK TRANSFER'}</span>
            </div>
            
            <div className="summary-total">
              <span>TOTAL</span>
              <span>{ticketType === "student" ? getStudentPrice() : getRegularPrice()}</span>
            </div>
            
            <button 
              className="btn-checkout" 
              onClick={handleConfirmCheckout}
              disabled={loading}
            >
              {loading ? "PROCESSING..." : "CONFIRM RESERVATION →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}