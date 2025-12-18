import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/header.css";

const Header = () => {
  const { user, logout } = useContext(AuthContext);

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
            <span className="username">👤 {user.username}</span>
            <button className="logout" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <span>Welcome, Guest</span>
        )}
      </div>
    </header>
  );
};

export default Header;