import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Header.css";

const Header = () => {
  const { user, logout, lastUpdated } = useContext(AuthContext);

  return (
    <header className="header">
      <nav>
        <Link to="/">Home</Link>
        {user && (
          <>
            <Link to="/locations">Locations</Link>
            <Link to="/favourites">Favourites</Link>
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
          </>
        )}
      </nav>
      <div className="user-info">
        {user ? (
          <>
            <span>👤 {user.username}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </div>
      {lastUpdated && (
        <div className="last-updated">
          <small>Last updated: {new Date(lastUpdated).toLocaleString()}</small>
        </div>
      )}
    </header>
  );
};

export default Header;