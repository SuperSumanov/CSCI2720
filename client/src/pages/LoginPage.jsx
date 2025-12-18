import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PinInput from "../components/PinInput";
import "../styles/login.css";

const LoginPage = () => {
  const { user, login, fetchTwoFactorStatus, twoFactorEnabled } =
    useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // 普通登录错误与加载状态
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 登录阶段 2FA 弹窗
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFALoginToken, setTwoFALoginToken] = useState("");
  const [twoFALoginError, setTwoFALoginError] = useState("");
  const [twoFALoginLoading, setTwoFALoginLoading] = useState(false);

  // 登录成功后提示开启 2FA 的弹窗
  const [showEnablePrompt, setShowEnablePrompt] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [emergencyResetCode, setEmergencyResetCode] = useState("");
  const [twoFASetupToken, setTwoFASetupToken] = useState("");
  const [twoFASetupError, setTwoFASetupError] = useState("");
  const [twoFASetupLoading, setTwoFASetupLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  // 管理员紧急重置 2FA 弹窗
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emUsername, setEmUsername] = useState("");
  const [emPassword, setEmPassword] = useState("");
  const [emCode, setEmCode] = useState("");
  const [emError, setEmError] = useState("");
  const [emLoading, setEmLoading] = useState(false);
  const [emSuccess, setEmSuccess] = useState("");

  const navigate = useNavigate();

  const redirectAfterLogin = (currentUser) => {
    const target = currentUser || user;
    if (!target) return;
    if (target.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/locations");
    }
  };

  // 统一处理登录成功后的逻辑（包括从 /login 或 /login/me 获取用户）
  const handleLoginSuccess = async (data) => {
    try {
      let finalUser = data.user || null;

      if (finalUser) {
        await login(finalUser);
      } else {
        const userRes = await fetch("/login/me", { credentials: "include" });
        if (!userRes.ok) {
          throw new Error("Failed to fetch user session");
        }
        finalUser = await userRes.json();
        await login(finalUser);
      }

      // 登录成功后检查 2FA 状态；如果已经开启直接跳转，否则弹出引导弹窗
      if (fetchTwoFactorStatus) {
        const enabled = await fetchTwoFactorStatus();
        if (!enabled) {
          setShowEnablePrompt(true);
          return;
        }
      }

      redirectAfterLogin(finalUser);
    } catch (err) {
      console.error("Handle login success error:", err);
      setError(err.message || "Login succeeded but session fetch failed");
    }
  };

  // 只用账号密码进行登录
  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // 后端要求 2FA，弹出 2FA 登录弹窗
      if (data.requires2FA) {
        setRequires2FA(true);
        setTwoFALoginToken("");
        setTwoFALoginError("");
        return;
      }

      await handleLoginSuccess(data);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 在 2FA 登录弹窗中提交 6 位验证码
  const submitTwoFALogin = async (tokenValue) => {
    if (!tokenValue || tokenValue.length !== 6) return;

    setTwoFALoginLoading(true);
    setTwoFALoginError("");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, token: tokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid 2FA token");
      }

      setRequires2FA(false);
      setTwoFALoginToken("");
      await handleLoginSuccess(data);
    } catch (err) {
      console.error("2FA login error:", err);
      setTwoFALoginError(err.message || "Invalid 2FA token");
      setTwoFALoginToken("");
    } finally {
      setTwoFALoginLoading(false);
    }
  };

  const handleTwoFALoginInputChange = (rawValue) => {
    const value = (rawValue || "").replace(/\D/g, "").slice(0, 6);
    setTwoFALoginToken(value);
    setTwoFALoginError("");

    if (value.length === 6 && !twoFALoginLoading) {
      submitTwoFALogin(value);
    }
  };

  // 2FA 设置：调用 /2fa/setup
  const startTwoFASetup = async () => {
    setSetupLoading(true);
    setSetupError("");
    setShowEnablePrompt(false);

    try {
      const response = await fetch("/2fa/setup", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup 2FA");
      }

      setQrCode(data.qrCode || "");
      setManualEntryKey(data.manualEntryKey || "");
      setEmergencyResetCode(data.emergencyResetCode || "");
      setShowSetupModal(true);
      setTwoFASetupToken("");
      setTwoFASetupError("");
      setSetupDone(false);
    } catch (err) {
      console.error("2FA setup error:", err);
      setSetupError(err.message || "Failed to setup 2FA");
    } finally {
      setSetupLoading(false);
    }
  };

  // 2FA 启用：调用 /2fa/enable
  const submitTwoFASetupToken = async (tokenValue) => {
    if (!tokenValue || tokenValue.length !== 6) return;

    setTwoFASetupLoading(true);
    setTwoFASetupError("");

    try {
      const response = await fetch("/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: tokenValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enable 2FA");
      }

      setSetupDone(true);
      setTwoFASetupToken("");

      // 更新全局 2FA 状态
      if (fetchTwoFactorStatus) {
        await fetchTwoFactorStatus();
      }

      // 3 秒后关闭弹窗
      setTimeout(() => {
        setShowSetupModal(false);
        setSetupDone(false);
        redirectAfterLogin();
      }, 3000);
    } catch (err) {
      console.error("2FA enable error:", err);
      setTwoFASetupError(err.message || "Failed to enable 2FA");
      setTwoFASetupToken("");
    } finally {
      setTwoFASetupLoading(false);
    }
  };

  const handleTwoFASetupInputChange = (rawValue) => {
    const value = (rawValue || "").replace(/\D/g, "").slice(0, 6);
    setTwoFASetupToken(value);
    setTwoFASetupError("");

    if (value.length === 6 && !twoFASetupLoading && !setupDone) {
      submitTwoFASetupToken(value);
    }
  };

  // 管理员紧急重置 2FA：/2fa/reset-with-emergency-code
  const handleEmergencyReset = async (e) => {
    e.preventDefault();
    setEmError("");
    setEmSuccess("");

    if (!emUsername || !emPassword || !emCode) {
      setEmError("Username, password and emergency code are required");
      return;
    }

    setEmLoading(true);

    try {
      const response = await fetch("/2fa/reset-with-emergency-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: emUsername,
          password: emPassword,
          emergencyCode: emCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset 2FA");
      }

      setEmSuccess(
        "2FA disabled successfully. You can now login again without 2FA."
      );
      setEmError("");
    } catch (err) {
      console.error("Emergency reset error:", err);
      setEmError(err.message || "Failed to reset 2FA");
      setEmSuccess("");
    } finally {
      setEmLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-box">
          <h2>Welcome to Cultural Programmes</h2>
          <p>Login to access venue and event information</p>

          <form onSubmit={handleCredentialLogin}>
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

          <button
            type="button"
            className="twofa-btn-link"
            onClick={() => setShowEmergencyModal(true)}
          >
            If admin cannot do 2FA
          </button>
        </div>
      </div>

      {/* 登录阶段：2FA 验证弹窗 */}
      {requires2FA && (
        <div className="twofa-overlay">
          <div className="twofa-modal twofa-modal--small">
            <div className="twofa-modal-header">
              <div className="twofa-icon-circle">
                <span className="twofa-icon-lock" />
              </div>
              <div>
                <h2 className="twofa-title">Two-Factor Authentication</h2>
                <p className="twofa-subtitle">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            </div>

            <PinInput
              length={6}
              value={twoFALoginToken}
              onChange={handleTwoFALoginInputChange}
              isError={!!twoFALoginError}
              disabled={twoFALoginLoading}
            />

            {twoFALoginError && (
              <p className="error twofa-error-text">{twoFALoginError}</p>
            )}

            <div className="twofa-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFALoginToken("");
                  setTwoFALoginError("");
                }}
                className="twofa-btn twofa-btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => submitTwoFALogin(twoFALoginToken)}
                disabled={twoFALoginLoading || twoFALoginToken.length !== 6}
                className="twofa-btn twofa-btn-primary"
              >
                {twoFALoginLoading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 登录成功后提示开启 2FA 的全屏弹窗 */}
      {showEnablePrompt && !twoFactorEnabled && (
        <div className="twofa-overlay">
          <div className="twofa-modal">
            <div className="twofa-modal-header">
              <div className="twofa-icon-circle twofa-icon-circle--info">
                <span className="twofa-icon-shield" />
              </div>
              <div>
                <h2 className="twofa-title">Protect your account with 2FA</h2>
                <p className="twofa-subtitle">
                  We recommend enabling two-factor authentication to better
                  protect your account.
                </p>
              </div>
            </div>

            {setupError && <p className="error twofa-error-text">{setupError}</p>}

            <div className="twofa-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowEnablePrompt(false);
                  redirectAfterLogin();
                }}
                className="twofa-btn twofa-btn-secondary"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={startTwoFASetup}
                disabled={setupLoading}
                className="twofa-btn twofa-btn-primary"
              >
                {setupLoading ? "Preparing..." : "Enable 2FA now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA 设置弹窗：展示二维码、手动码与紧急恢复码 */}
      {showSetupModal && (
        <div className="twofa-overlay">
          <div className="twofa-modal">
            {!setupDone ? (
              <>
                <div className="twofa-modal-header">
                  <div className="twofa-icon-circle">
                    <span className="twofa-icon-lock" />
                  </div>
                  <div>
                    <h2 className="twofa-title">
                      Enable Two-Factor Authentication
                    </h2>
                    <p className="twofa-subtitle">
                      Scan the QR code with your authenticator app, or enter the
                      manual key below.
                    </p>
                  </div>
                </div>

                {qrCode && (
                  <div className="twofa-qrcode-wrapper">
                    <img src={qrCode} alt="2FA QR Code" />
                  </div>
                )}

                {manualEntryKey && (
                  <div className="twofa-manual-key">
                    Manual entry key:{" "}
                    <span className="twofa-code-text">{manualEntryKey}</span>
                  </div>
                )}

                {emergencyResetCode && (
                  <div className="twofa-emergency">
                    <strong>Emergency reset code (admin only): </strong>
                    <span className="twofa-code-text">
                      {emergencyResetCode}
                    </span>
                    <br />
                    Please store this code safely. It can be used to disable
                    your 2FA in emergencies.
                  </div>
                )}

                <p className="twofa-helper-text">
                  After adding the account to your authenticator app, enter the
                  6-digit code here. It will be submitted automatically once you
                  type 6 digits.
                </p>

                {twoFASetupError && (
                  <p className="error twofa-error-text">{twoFASetupError}</p>
                )}

                <PinInput
                  length={6}
                  value={twoFASetupToken}
                  onChange={handleTwoFASetupInputChange}
                  isError={!!twoFASetupError}
                  disabled={twoFASetupLoading || setupDone}
                />

                <div className="twofa-modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSetupModal(false);
                      setTwoFASetupToken("");
                      setTwoFASetupError("");
                    }}
                    className="twofa-btn twofa-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => submitTwoFASetupToken(twoFASetupToken)}
                    disabled={
                      twoFASetupLoading ||
                      twoFASetupToken.length !== 6 ||
                      setupDone
                    }
                    className="twofa-btn twofa-btn-primary"
                  >
                    {twoFASetupLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="twofa-modal-header">
                  <div className="twofa-icon-circle twofa-icon-circle--success">
                    <span className="twofa-icon-check" />
                  </div>
                  <div>
                    <h2 className="twofa-title">2FA Enabled</h2>
                    <p className="twofa-subtitle">
                      Your two-factor authentication has been enabled.
                    </p>
                  </div>
                </div>
                <p className="twofa-helper-text">
                  This window will close automatically in a few seconds.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 管理员紧急重置 2FA 弹窗 */}
      {showEmergencyModal && (
        <div className="twofa-overlay">
          <div className="twofa-modal">
            <div className="twofa-modal-header">
              <div className="twofa-icon-circle twofa-icon-circle--danger">
                <span className="twofa-icon-lock-open" />
              </div>
              <div>
                <h2 className="twofa-title">Admin emergency 2FA reset</h2>
                <p className="twofa-subtitle">
                  If you lost access to your 2FA device, use your username,
                  password and emergency reset code to disable 2FA.
                </p>
              </div>
            </div>

            <form onSubmit={handleEmergencyReset}>
              <input
                type="text"
                placeholder="Admin username"
                value={emUsername}
                onChange={(e) => setEmUsername(e.target.value)}
                className="twofa-text-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={emPassword}
                onChange={(e) => setEmPassword(e.target.value)}
                className="twofa-text-input"
              />
              <input
                type="text"
                placeholder="Emergency reset code"
                value={emCode}
                onChange={(e) => setEmCode(e.target.value.trim())}
                className="twofa-text-input"
              />

              {emError && (
                <p className="error twofa-error-text">{emError}</p>
              )}
              {emSuccess && (
                <p
                  className="twofa-error-text"
                  style={{ color: "#059669", fontSize: "12px" }}
                >
                  {emSuccess}
                </p>
              )}

              <div className="twofa-modal-actions">
                <button
                  type="button"
                  className="twofa-btn twofa-btn-secondary"
                  onClick={() => {
                    setShowEmergencyModal(false);
                    setEmUsername("");
                    setEmPassword("");
                    setEmCode("");
                    setEmError("");
                    setEmSuccess("");
                  }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={emLoading}
                  className="twofa-btn twofa-btn-danger"
                >
                  {emLoading ? "Submitting..." : "Reset 2FA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPage;