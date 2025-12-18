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
  const [pendingUser, setPendingUser] = useState(null);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 重要：包含 session cookie
        body: JSON.stringify({
          username,
          password,
          token: requires2FA ? token : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requires2FA && !requires2FA) {
        // 需要 2FA 验证
        setRequires2FA(true);
        setPendingUser({ username, password });
        setError("");
        setLoading(false);
        return;
      }

    // ✅ 如果后端已经返回用户信息，则直接使用，不再请求 /login/me
    if (data.user) {
      login(data.user.username, data.user.role);
      navigate(data.user.role === "admin" ? "/admin" : "/locations");
      return;
    }

    // 兼容旧后端（未返回用户信息）逻辑
    const userRes = await fetch("/login/me", {
      credentials: "include",
    });
    let userData;
    if (userRes.ok) {
      userData = await userRes.json();
    } else {
      setError("Failed to fetch user session");
      return;
    }

    login(userData.username, userData.role);
    navigate(userData.role === "admin" ? "/admin" : "/locations");

        } catch (err) {
          setError(err.message);
          console.error("Login error:", err);
        } finally {
          setLoading(false);
        }
      };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(e);
  };

  // 处理 2FA 令牌提交
  const handle2FASubmit = (e) => {
    e.preventDefault();
    if (!token) {
      setError("Please enter 2FA token");
      return;
    }
    handleLogin(e);
  };

  // 返回普通登录表单
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

  // 2FA 表单
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