import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/header.css";

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="header-left">
        <h1>Cultural Programmes</h1>
      </div>

      <nav className="header-nav">
        {user ? (
          <>
            <Link to="/locations">Home</Link>
            <Link to="/favourites">Favourites</Link>
            {user.role === "admin" && <Link to="/admin">Admin Panel</Link>}
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </nav>

      <div className="header-right">
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