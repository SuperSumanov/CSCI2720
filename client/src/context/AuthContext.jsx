import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { username, role }
  const [lastUpdated, setLastUpdated] = useState(null);

  const login = (userData) => {
    setUser(userData);
    setLastUpdated(new Date().toISOString());
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, lastUpdated }}>
      {children}
    </AuthContext.Provider>
  );
};