import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import Navbar from "./Navbar";
import HeroCarousel from "./HeroCarousel";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    
    setUser(currentUser);
    
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("User data from Firestore:", data); // Debug log
          setUserData(data);
        } else {
          console.log("No user document found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
    
    const today = new Date().toISOString().split('T')[0];
    const eventsQuery = query(
      collection(db, "events"),
      where("date", ">=", today)
    );
    
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpcomingEvents(eventsList);
      setFeaturedEvents(eventsList.slice(0, 5));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });
    
    return () => {
      unsubscribeEvents();
    };
  }, [navigate]);

  const getEventImage = (event) => {
    if (event.imageUrl) return event.imageUrl;
    const placeholders = {
      Concert: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=250&fit=crop",
      Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=250&fit=crop",
      Academic: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=250&fit=crop",
      Cultural: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=250&fit=crop"
    };
    return placeholders[event.category] || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=250&fit=crop";
  };

  // Get display price for event card
  const getDisplayPrice = (event) => {
    if (event.priceType === "free") {
      return "FREE";
    }
    if (event.studentPrice && event.outsiderPrice) {
      return `🎓 ${event.studentPrice} | 👤 ${event.outsiderPrice}`;
    }
    if (event.studentPrice) {
      return event.studentPrice;
    }
    if (event.outsiderPrice) {
      return event.outsiderPrice;
    }
    return "FREE";
  };

  // Get department display name
  const getDepartmentName = () => {
    const departments = {
      "BSIT": "Information Technology",
      "BSCS": "Computer Science",
      "BSIS": "Information Systems",
      "BSBA": "Business Administration",
      "BSHM": "Hospitality Management",
      "BSTM": "Tourism Management",
      "BSA": "Accountancy",
      "BSEE": "Electrical Engineering",
      "BSCE": "Civil Engineering",
      "BSME": "Mechanical Engineering",
      "BSN": "Nursing",
      "BSPsych": "Psychology",
      "BSEd": "Education",
      "ABComm": "Communication",
      "Other": "Other Department"
    };
    
    // If userData is null or undefined
    if (!userData) return "Loading...";
    
    // Check if department exists
    if (userData.department && userData.department !== "N/A") {
      return departments[userData.department] || userData.department;
    }
    
    return "Not specified";
  };

  // Get student ID display
  const getStudentId = () => {
    if (!userData) return "Loading...";
    if (userData.studentId && userData.studentId !== "ADMIN") {
      return userData.studentId;
    }
    return "Not specified";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading dashboard...</div>
      </>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      {/* Hero Carousel - Featured Events */}
      {featuredEvents.length > 0 && <HeroCarousel events={featuredEvents} />}
      
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <h1>Welcome back, {userData?.name || user?.displayName || "Student"}!</h1>
              <p>Student ID: {getStudentId()}</p>
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", opacity: 0.9 }}>
                Access your event tickets and institutional records
              </p>
            </div>
            <div className="member-status">
              <div className="status-label">DEPARTMENT</div>
              <div className="status-value">{getDepartmentName()}</div>
             
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{upcomingEvents.length}</h3>
              <p>UPCOMING EVENTS</p>
            </div>
            <div className="stat-card">
              <h3>142</h3>
              <p>SCAN CREDITS</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={() => navigate("/events")} className="btn-primary">
              BROWSE ALL EVENTS
            </button>
            <button onClick={() => navigate("/my-tickets")} className="btn-secondary">
              VIEW MY TICKETS
            </button>
          </div>
        </div>
        
        {/* Featured Events Grid */}
        {upcomingEvents.length > 0 && (
          <div className="events-preview">
            <h2>UPCOMING EVENTS</h2>
            <div className="events-grid">
              {upcomingEvents.slice(0, 4).map(event => (
                <div key={event.id} className="event-card featured-event-card">
                  <div className="event-image-container">
                    <img 
                      src={getEventImage(event)} 
                      alt={event.name}
                      className="event-grid-image"
                    />
                    <div className="event-price-tag">
                      {getDisplayPrice(event)}
                    </div>
                  </div>
                  <div className="event-details">
                    <h3>{event.name}</h3>
                    <div className="event-meta">
                      <span>📅 {event.date}</span>
                      <span>📍 {event.venue}</span>
                    </div>
                    <div className="event-ticket-info">
                      <span>🎟️ {event.availableTickets} tickets left</span>
                    </div>
                    <button 
                      onClick={() => navigate("/events")}
                      className="buy-ticket-btn"
                    >
                      BUY TICKETS →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {upcomingEvents.length > 4 && (
              <div className="view-all-btn-container">
                <button onClick={() => navigate("/events")} className="view-all-btn">
                  VIEW ALL EVENTS
                </button>
              </div>
            )}
          </div>
        )}
        
        {upcomingEvents.length === 0 && (
          <div className="no-events">
            <p>No upcoming events at the moment. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}