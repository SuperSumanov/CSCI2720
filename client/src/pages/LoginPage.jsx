import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css";

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    // Mocked login just for frontend testing
    if (username === "admin" && password === "admin") {
      login(username, "admin");
      navigate("/admin");
    } else {
      login(username, "user");
      navigate("/locations");
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
          💡 Try username: <b>admin</b>, password: <b>admin</b>
        </small>
      </div>
    </div>
  );
};

export default LoginPage;
