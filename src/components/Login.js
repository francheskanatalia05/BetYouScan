import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      console.log("User UID:", user.uid);
      console.log("User Doc exists:", userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User Data:", userData);
        console.log("User Role:", userData?.role);
        
        const role = userData?.role || "student";
        
        if (role === "admin") {
          console.log("Redirecting to Admin Dashboard");
          navigate("/admin");
        } else {
          console.log("Redirecting to Student Dashboard");
          navigate("/dashboard");
        }
      } else {
        console.log("No user document found, creating as student");
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetMessage("Please enter your email address");
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(`Password reset email sent to ${resetEmail}. Check your inbox.`);
      setTimeout(() => {
        setShowResetModal(false);
        setResetMessage("");
        setResetEmail("");
      }, 3000);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setResetMessage("No account found with this email address.");
      } else {
        setResetMessage("Error sending reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>BYS</h1>
          <p>Institutional Ticketing System</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <h2>Login to Your Account</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div style={{ textAlign: "right", marginBottom: "1rem" }}>
            <button 
              type="button" 
              onClick={() => setShowResetModal(true)}
              style={{ 
                background: "none", 
                border: "none", 
                color: "#990000", 
                fontSize: "0.7rem",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Forgot Password?
            </button>
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="modal" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "400px" }}>
            <span className="modal-close" onClick={() => setShowResetModal(false)}>&times;</span>
            <h3 style={{ color: "#990000", marginBottom: "1rem" }}>Reset Password</h3>
            <p style={{ fontSize: "0.8rem", marginBottom: "1rem", color: "#666" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            {resetMessage && (
              <div className={`message ${resetMessage.includes("sent") ? "success" : "error"}`} style={{ marginBottom: "1rem" }}>
                {resetMessage}
              </div>
            )}
            <button 
              onClick={handleForgotPassword} 
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}