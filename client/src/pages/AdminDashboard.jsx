import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => (
  <div className="admin-dashboard">
    <div className="dashboard-header">
      <h2>Admin Dashboard</h2>
      <p className="dashboard-subtitle">Administrative Control Panel</p>
    </div>
    
    <div className="dashboard-content">
      <div className="dashboard-card">
        <div className="card-icon">👥</div>
        <h3>User Management</h3>
        <p>View, edit, and manage user accounts and permissions</p>
        <Link to="/admin/users" className="dashboard-link">
          Manage Users
        </Link>
      </div>
      
      <div className="dashboard-card">
        <div className="card-icon">📍</div>
        <h3>Location Management</h3>
        <p>Add, edit, and manage event locations and venues</p>
        <Link to="/admin/events" className="dashboard-link">
          Manage Locations
        </Link>
      </div>
    </div>
  </div>
);

// You can add these styles to your CSS file or use a CSS-in-JS solution
const styles = `
  .admin-dashboard {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 30px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .dashboard-header {
    text-align: center;
    margin-bottom: 60px;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .dashboard-header h2 {
    font-size: 2.8rem;
    margin-bottom: 10px;
    font-weight: 700;
  }

  .dashboard-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    font-weight: 300;
  }

  .dashboard-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-card {
    background: white;
    border-radius: 15px;
    padding: 35px 30px;
    width: 300px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dashboard-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  }

  .card-icon {
    font-size: 3.5rem;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .dashboard-card h3 {
    font-size: 1.6rem;
    color: #333;
    margin-bottom: 15px;
    font-weight: 600;
  }

  .dashboard-card p {
    color: #666;
    line-height: 1.6;
    margin-bottom: 25px;
    font-size: 1rem;
  }

  .dashboard-link {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    padding: 12px 30px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    margin-top: auto;
  }

  .dashboard-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    color: white;
    text-decoration: none;
  }

  @media (max-width: 768px) {
    .admin-dashboard {
      padding: 20px;
    }
    
    .dashboard-header h2 {
      font-size: 2.2rem;
    }
    
    .dashboard-content {
      flex-direction: column;
      align-items: center;
    }
    
    .dashboard-card {
      width: 100%;
      max-width: 350px;
    }
  }
`;

// If using a CSS file, you can copy the styles above to your CSS file
// and remove this inline style tag
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default AdminDashboard;