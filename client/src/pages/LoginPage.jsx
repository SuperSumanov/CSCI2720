import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css";

const LoginPage = () => {
  const { user, login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/locations");
      }
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    // Mock login (frontend only)
    if (username === "admin" && password === "admin") {
      login(username, "admin");
      navigate("/admin");
    } else if (username === "user" && password === "user") {
      login(username, "user");
      navigate("/locations");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome to Cultural Programmes</h2>
        <p>Login to access venue and event information</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">Log In</button>
        </form>

        <small className="hint">
          💡 Try username: <b>admin</b>, password: <b>admin</b> <br />
          or username: <b>user</b>, password: <b>user</b>
        </small>
      </div>
    </div>
  );
};

export default LoginPage;