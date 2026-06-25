import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    department: "",  
    role: "student"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  
  const ADMIN_SECRET_KEY = "BYSADMIN2026";
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role: role,
      studentId: role === "admin" ? "ADMIN" : "",
      department: role === "admin" ? "N/A" : "" // Reset department for admin
    });
    if (role === "admin") {
      setShowAdminKey(true);
    } else {
      setShowAdminKey(false);
      setAdminKey("");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.role === "admin" && adminKey !== ADMIN_SECRET_KEY) {
      setError("Invalid admin registration key!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    // For students, student ID is required
    if (formData.role === "student" && !formData.studentId) {
      setError("Student ID is required for student registration!");
      return;
    }

    // For students, department is required
    if (formData.role === "student" && !formData.department) {
      setError("Please select your department!");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: formData.name
      });
      
      // Updated Firestore save with department field
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        studentId: formData.role === "admin" ? "ADMIN" : formData.studentId,
        department: formData.role === "student" ? formData.department : "N/A",
        role: formData.role,
        createdAt: new Date().toISOString()
      });
      
      alert(`Registration Successful! Logging in as ${formData.role.toUpperCase()}`);
      
      if (formData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered!");
      } else {
        setError("Registration failed. Please try again.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>BYS</h1>
          <p>Create Your Institutional Account</p>
        </div>
        
        <form onSubmit={handleRegister} className="register-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          {/* Only show Student ID field for students */}
          {formData.role === "student" && (
            <>
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  placeholder="Enter your student ID"
                  value={formData.studentId}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
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
            </>
          )}
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password (min. 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Register as:</label>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === "student"}
                  onChange={() => handleRoleChange("student")}
                />
                Student
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === "admin"}
                  onChange={() => handleRoleChange("admin")}
                />
                Event Organizer / Admin
              </label>
            </div>
          </div>
          
          {showAdminKey && (
            <div className="form-group">
              <label>Admin Registration Key</label>
              <input
                type="password"
                placeholder="Enter admin registration key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
              />
              <small style={{ color: "#666", fontSize: "0.7rem", display: "block", marginTop: "0.25rem" }}>
                Key: BYSADMIN2026
              </small>
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating Account..." : "Register"}
          </button>
          
          <p className="login-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}