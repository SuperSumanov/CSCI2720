import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/login.css";

const LoginPage = () => {
  const { user, login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(""); // 2FA token
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const navigate = useNavigate();

  // ✅ 已登录用户重定向
  useEffect(() => {
    console.log("LoginPage: Current user:", user);
    if (user) {
      console.log("LoginPage: User already logged in, redirecting based on role:", user.role);
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/locations");
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Login attempt for:", username);
      
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
          token: requires2FA ? token : undefined,
        }),
      });

      console.log("Login response status:", response.status);
      const data = await response.json();
      console.log("Login response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requires2FA && !requires2FA) {
        console.log("2FA required");
        setRequires2FA(true);
        setError("");
        setLoading(false);
        return;
      }

      // ✅ 使用后端返回的完整用户对象
      if (data.user) {
        console.log("Setting user context with:", data.user);
        // 调用login函数，传入完整的user对象
        login(data.user);
        
        // 不需要在这里navigate，因为useEffect会处理重定向
        // useEffect会检测到user状态变化并自动重定向
        return;
      }

      // 如果后端没有返回user数据，尝试从/login/me获取
      console.log("Fetching user data from /login/me");
      const userRes = await fetch("/login/me", {
        credentials: "include",
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log("User data from /login/me:", userData);
        login(userData);
      } else {
        throw new Error("Failed to fetch user session");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(e);
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please enter 2FA token");
      return;
    }
    handleLogin(e);
  };

  // 显示登录表单...
  if (!requires2FA) {
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
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <small className="hint">
            💡 Demo accounts are disabled. Use your real credentials.
          </small>
        </div>
      </div>
    );
  }

  // 2FA 表单...
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Two-Factor Authentication</h2>
        <p>Enter the 6-digit code from your authenticator app</p>

        <form onSubmit={handle2FASubmit}>
          <input
            type="text"
            placeholder="6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength="6"
            pattern="\d{6}"
            required
            autoFocus
          />

          {error && <p className="error">{error}</p>}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setToken("");
                setError("");
              }}
              style={{ backgroundColor: "#6c757d" }}
            >
              Back
            </button>
          </div>
        </form>

        <small className="hint">
          🔐 Open your authenticator app (Google Authenticator, Authy, etc.)
        </small>
      </div>
    </div>
  );
};

export default LoginPage;