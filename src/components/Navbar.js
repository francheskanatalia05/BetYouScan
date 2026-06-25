import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/dashboard" className="logo">
          BYS
        </Link>
        
        <ul className="nav-links">
          <li><Link to="/dashboard">DASHBOARD</Link></li>
          <li><Link to="/events">EVENTS</Link></li>
          <li><Link to="/my-tickets">MY TICKETS</Link></li>
          <li><Link to="/check-in">CHECK-IN</Link></li>
          <li>
            <button onClick={handleLogout} className="logout-btn">
              LOGOUT
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}