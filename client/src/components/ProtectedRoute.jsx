import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/locations" replace />;

  return children;
};

export default ProtectedRoute;