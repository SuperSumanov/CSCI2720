import React, { useContext, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PinInput from "./PinInput";
import "../styles/header.css";

const Header = () => {
  const { user, logout, twoFactorEnabled, fetchTwoFactorStatus } =
    useContext(AuthContext);

  const [hoveringAvatar, setHoveringAvatar] = useState(false);
  const [localTwoFactorEnabled, setLocalTwoFactorEnabled] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);

  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  // 启用 2FA 所需状态
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [emergencyResetCode, setEmergencyResetCode] = useState("");
  const [twoFASetupToken, setTwoFASetupToken] = useState("");
  const [twoFASetupError, setTwoFASetupError] = useState("");
  const [twoFASetupLoading, setTwoFASetupLoading] = useState(false);
  const [setupDone, setSetupDone] = useState(false);

  // 关闭 2FA 所需状态
  const [disablePassword, setDisablePassword] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [disableError, setDisableError] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disablePasswordError, setDisablePasswordError] = useState(false);
  const [disableTokenError, setDisableTokenError] = useState(false);
  const hideMenuTimeoutRef = useRef(null);

  const handleAvatarMouseEnter = async () => {
    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current);
      hideMenuTimeoutRef.current = null;
    }

    setHoveringAvatar(true);
    setMenuLoading(true);
    try {
      const enabled =
        typeof fetchTwoFactorStatus === "function"
          ? await fetchTwoFactorStatus()
          : false;
      setLocalTwoFactorEnabled(enabled);
    } catch (e) {
      setLocalTwoFactorEnabled(false);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleAvatarMouseLeave = () => {
    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current);
    }
    hideMenuTimeoutRef.current = setTimeout(() => {
      setHoveringAvatar(false);
    }, 160);
  };

  // Header 内启用 2FA：先调用 /2fa/setup
  const startTwoFASetup = async () => {
    setSetupLoading(true);
    setSetupError("");

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
      setShowEnableModal(true);
      setTwoFASetupToken("");
      setTwoFASetupError("");
      setSetupDone(false);
    } catch (err) {
      console.error("Header 2FA setup error:", err);
      setSetupError(err.message || "Failed to setup 2FA");
    } finally {
      setSetupLoading(false);
    }
  };

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

      if (typeof fetchTwoFactorStatus === "function") {
        const enabled = await fetchTwoFactorStatus();
        setLocalTwoFactorEnabled(enabled);
      }

      setTimeout(() => {
        setShowEnableModal(false);
        setSetupDone(false);
      }, 3000);
    } catch (err) {
      console.error("Header 2FA enable error:", err);
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

  // Header 内关闭 2FA
  const submitDisable2FA = async () => {
    if (!disablePassword || !disableToken || disableToken.length !== 6) {
      setDisableError("Password and 6-digit token are required");
      setDisablePasswordError(!disablePassword);
      setDisableTokenError(!disableToken || disableToken.length !== 6);
      return;
    }

    setDisableLoading(true);
    setDisableError("");
    setDisablePasswordError(false);
    setDisableTokenError(false);

    try {
      const response = await fetch("/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          password: disablePassword,
          token: disableToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || "Failed to disable 2FA";
        setDisableError(msg);

        // 根据后端错误信息判断是密码错还是 2FA token 错
        const lower = msg.toLowerCase();
        if (lower.includes("password")) {
          setDisablePasswordError(true);
          setDisableTokenError(false);
        } else if (lower.includes("2fa") || lower.includes("token")) {
          setDisablePasswordError(false);
          setDisableTokenError(true);
          setDisableToken("");
        }
        return;
      }

      if (typeof fetchTwoFactorStatus === "function") {
        const enabled = await fetchTwoFactorStatus();
        setLocalTwoFactorEnabled(enabled);
      }

      setShowDisableModal(false);
      setDisablePassword("");
      setDisableToken("");
    } catch (err) {
      console.error("Disable 2FA error:", err);
      const msg = err.message || "Failed to disable 2FA";
      setDisableError(msg);
    } finally {
      setDisableLoading(false);
    }
  };

  const effectiveTwoFactorEnabled =
    localTwoFactorEnabled !== null ? localTwoFactorEnabled : twoFactorEnabled;

  // 主题切换逻辑
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // 初始化主题
  useEffect(() => {
    // 检查 localStorage 或系统主题
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const theme = storedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1>Cultural Programmes</h1>
      </div>

      <nav className="header-nav">
        {user ? (
          <>
            <Link to="/locations">Home</Link>
            <Link to="/locations">Locations list</Link>
            <Link to="/events">Events list</Link>
            <Link to="/favourites">Favourites</Link>
            <Link to="/map">Map</Link>
            {user.role === "admin" && <Link to="/admin">Admin Panel</Link>}
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </nav>

      <div className="header-right">
        {/* 主题切换按钮 */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          <span className="sun-icon">☀️</span>
          <span className="moon-icon" style={{ display: 'none' }}>🌙</span>
        </button>

        {user ? (
          <>
            <div
              style={{ position: "relative", display: "inline-block" }}
              onMouseEnter={handleAvatarMouseEnter}
              onMouseLeave={handleAvatarMouseLeave}
            >
              <span className="username">👤 {user.username}</span>

              {hoveringAvatar && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    padding: "8px 12px",
                    zIndex: 500,
                    minWidth: "160px",
                  }}
                >
                  {menuLoading ? (
                    <div style={{ fontSize: "12px" }}>Checking 2FA status...</div>
                  ) : effectiveTwoFactorEnabled ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisableModal(true);
                        setDisableError("");
                      }}
                      style={{
                        width: "100%",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSetupError("");
                        startTwoFASetup();
                      }}
                      style={{
                        width: "100%",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        border: "none",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Enable 2FA
                    </button>
                  )}
                </div>
              )}
            </div>

            <button className="logout" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <span>Welcome, Guest</span>
        )}
      </div>

      {/* Header 中启用 2FA 的弹窗 */}
      {showEnableModal && (
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

                {setupError && (
                  <p className="error twofa-error-text">{setupError}</p>
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
                      setShowEnableModal(false);
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

      {/* Header 中关闭 2FA 的弹窗 */}
      {showDisableModal && (
        <div className="twofa-overlay">
          <div className="twofa-modal">
            <div className="twofa-modal-header">
              <div className="twofa-icon-circle twofa-icon-circle--danger">
                <span className="twofa-icon-lock-open" />
              </div>
              <div>
                <h2 className="twofa-title">Disable Two-Factor Authentication</h2>
                <p className="twofa-subtitle">
                  Confirm your password and a current 6-digit code to turn off
                  2FA.
                </p>
              </div>
            </div>

            <input
              type="password"
              placeholder="Password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className={
                disablePasswordError
                  ? "twofa-text-input twofa-text-input-error"
                  : "twofa-text-input"
              }
            />

            <PinInput
              length={6}
              value={disableToken}
              onChange={(val) =>
                setDisableToken(val.replace(/\D/g, "").slice(0, 6))
              }
              isError={disableTokenError}
              disabled={disableLoading}
            />

            {disableError && (
              <p className="error twofa-error-text">{disableError}</p>
            )}

            <div className="twofa-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablePassword("");
                  setDisableToken("");
                  setDisableError("");
                  setDisablePasswordError(false);
                  setDisableTokenError(false);
                }}
                className="twofa-btn twofa-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDisable2FA}
                disabled={disableLoading}
                className="twofa-btn twofa-btn-danger"
              >
                {disableLoading ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;