import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Events from "./components/Events";
import MyTickets from "./components/MyTickets";
import CheckIn from "./components/CheckIn";
import Checkout from "./components/Checkout";
import AdminDashboard from "./components/AdminDashboard";
import "./styles/App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setUserRole(role);
            console.log("User role from Firestore:", role);
          } else {
            setUserRole("student");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole("student");
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">LOADING INSTITUTIONAL ACCESS...</div>;
  }

  console.log("Current user:", user?.email);
  console.log("User role:", userRole);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} />} />
          <Route path="/dashboard" element={user && userRole !== "admin" ? <Dashboard /> : <Navigate to={user ? "/admin" : "/login"} />} />
          <Route path="/events" element={user ? <Events /> : <Navigate to="/login" />} />
          <Route path="/my-tickets" element={user ? <MyTickets /> : <Navigate to="/login" />} />
          <Route path="/check-in" element={user ? <CheckIn /> : <Navigate to="/login" />} />
          <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && userRole === "admin" ? <AdminDashboard /> : <Navigate to={user ? "/dashboard" : "/login"} />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;