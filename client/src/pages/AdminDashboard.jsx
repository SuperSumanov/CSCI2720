import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => (
  <div>
    <h2>Admin Dashboard</h2>
    <ul>
      <li><Link to="/admin/users">Manage Users</Link></li>
      <li><Link to="/admin/locations">Manage Locations</Link></li>
    </ul>
  </div>
);

export default AdminDashboard;