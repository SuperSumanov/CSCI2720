import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/locations.css";

// 添加用户模态框组件
const UserModal = ({ isOpen, onClose, onSubmit, user = null }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "user"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        password: "",
        confirmPassword: "",
        role: user.role || "user"
      });
    } else {
      setFormData({
        username: "",
        password: "",
        confirmPassword: "",
        role: "user"
      });
    }
    setError("");
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!user && (!formData.password || !formData.confirmPassword)) {
      setError("Password is required for new users");
      return;
    }
    
    if (!user && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      // 准备提交的数据
      const submitData = {
        username: formData.username,
        role: formData.role
      };
      
      // 如果有密码，添加到提交数据中
      if (formData.password) {
        submitData.password = formData.password;
      }
      
      await onSubmit(submitData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <h3 style={{ marginBottom: "1rem", color: "#333" }}>
          {user ? "Edit User" : "Add New User"}
        </h3>
        
        {error && (
          <div style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isSubmitting || user} // 编辑时不能修改用户名
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: isSubmitting || user ? "#f8f9fa" : "white"
              }}
            />
          </div>

          {!user && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!user}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: isSubmitting ? "#f8f9fa" : "white"
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!user}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: isSubmitting ? "#f8f9fa" : "white"
                  }}
                />
              </div>
            </>
          )}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: isSubmitting ? "#f8f9fa" : "white"
              }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: isSubmitting ? "#adb5bd" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSubmitting ? "not-allowed" : "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: isSubmitting ? "#6c98ea" : "#2c7be5",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {isSubmitting && (
                <span style={{ width: "12px", height: "12px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
              )}
              {user ? "Update" : "Add"} User
            </button>
          </div>
        </form>
        
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

// 分页组件（与AdminEventsPage相同）
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const maxVisiblePages = 5;
  
  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = startPage + maxVisiblePages - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.5rem",
      marginTop: "2rem",
      padding: "1rem",
      flexWrap: "wrap"
    }}>
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: currentPage === 1 ? "#e9ecef" : "#fff",
          color: currentPage === 1 ? "#6c757d" : "#2c7be5",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          fontSize: "0.9rem"
        }}
      >
        First
      </button>
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: currentPage === 1 ? "#e9ecef" : "#fff",
          color: currentPage === 1 ? "#6c757d" : "#2c7be5",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          fontSize: "0.9rem"
        }}
      >
        Previous
      </button>
      
      {pageNumbers[0] > 1 && (
        <span style={{ color: "#6c757d", padding: "0 0.5rem" }}>...</span>
      )}
      
      {pageNumbers.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: currentPage === page ? "#2c7be5" : "#fff",
            color: currentPage === page ? "#fff" : "#2c7be5",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: currentPage === page ? "bold" : "normal",
            fontSize: "0.9rem"
          }}
        >
          {page}
        </button>
      ))}
      
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <span style={{ color: "#6c757d", padding: "0 0.5rem" }}>...</span>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: currentPage === totalPages ? "#e9ecef" : "#fff",
          color: currentPage === totalPages ? "#6c757d" : "#2c7be5",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          fontSize: "0.9rem"
        }}
      >
        Next
      </button>
      
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: currentPage === totalPages ? "#e9ecef" : "#fff",
          color: currentPage === totalPages ? "#6c757d" : "#2c7be5",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          fontSize: "0.9rem"
        }}
      >
        Last
      </button>
      
      <span style={{ marginLeft: "1rem", color: "#6c757d", fontSize: "0.9rem" }}>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

// 页面大小选择器
const PageSizeSelector = ({ pageSize, onChange }) => {
  const options = [10, 25, 50, 100];
  
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginTop: "1rem"
    }}>
      <label style={{ fontSize: "0.9rem", color: "#666" }}>
        Show:
      </label>
      <select
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          padding: "0.4rem 0.6rem",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#fff",
          fontSize: "0.9rem"
        }}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option} per page
          </option>
        ))}
      </select>
    </div>
  );
};

const AdminUsersPage = () => {
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [fetchError, setFetchError] = useState("");
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // 检查用户是否已登录且是管理员
    useEffect(() => {
    if (!authLoading && !currentUser) {
        navigate('/login');
        return;
    }
    
    if (!authLoading && currentUser && currentUser.role !== 'admin') {
        navigate('/');
        return;
    }

    if (currentUser && currentUser.role === 'admin') {
        fetchUsers();
    }
    }, [currentUser, authLoading, navigate]);

  // 加载用户数据
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setFetchError("");
      
      const res = await fetch("/admin/users", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login');
          throw new Error("Authentication required. Please log in again.");
        } else if (res.status === 403) {
          navigate('/');
          throw new Error("You don't have permission to access this page.");
        } else {
          throw new Error(`Failed to fetch users: ${res.status}`);
        }
      }
      
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setFetchError(err.message || "Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  // 搜索过滤
  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.role?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // 计算分页数据
  useEffect(() => {
    const total = Math.ceil(filteredUsers.length / pageSize);
    setTotalPages(total > 0 ? total : 1);
    
    // 如果当前页超过总页数，跳转到第一页
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredUsers, pageSize, currentPage]);

  // 获取当前页的数据
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, pageSize]);

  // 模态框处理函数
  const handleAddClick = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    try {
      let res;
      let method;
      let url;
      
      if (editingUser) {
        // 更新现有用户
        method = "PUT";
        url = `/admin/users/${editingUser.username}`;
      } else {
        // 添加新用户
        method = "POST";
        url = `/admin/users`;
      }
      
      res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || `Failed to ${editingUser ? 'update' : 'add'} user`);
      }
      
      // 重新获取数据以确保与数据库同步
      await fetchUsers();
      
    } catch (err) {
      console.error("Error saving user:", err);
      throw err;
    }
  };

  const handleDelete = async (username) => {
    // 不能删除当前登录的用户
    if (username === currentUser?.username) {
      alert("You cannot delete your own account while logged in.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/admin/users/${username}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete user");
      }
      
      // 重新获取数据以确保与数据库同步
      await fetchUsers();
      
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`Error deleting user: ${err.message}`);
    }
  };

  const handleReset2FA = async (username) => {
    if (!window.confirm(`Are you sure you want to reset 2FA for user "${username}"?`)) return;
    
    try {
      const res = await fetch(`/admin/users/${username}/reset-2fa`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reset 2FA");
      }
      
      alert(`2FA has been reset for user "${username}"`);
      // 可选：重新获取数据以更新显示
      await fetchUsers();
      
    } catch (err) {
      console.error("Error resetting 2FA:", err);
      alert(`Error resetting 2FA: ${err.message}`);
    }
  };

  // 分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 滚动到表格顶部
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // 重置到第一页
  };

  if (authLoading) {
    return (
      <main className="locations-page">
        <h2>Manage Users</h2>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "200px" 
        }}>
          <p>Checking authentication...</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="locations-page">
        <h2>Manage Users</h2>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "200px" 
        }}>
          <p>Loading users from server...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="locations-page">
      <h2>Manage Users</h2>

      {fetchError && (
        <div style={{
          padding: "1rem",
          marginBottom: "1rem",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
          borderRadius: "4px"
        }}>
          <strong>Error:</strong> {fetchError}
          <button 
            onClick={fetchUsers}
            style={{
              marginLeft: "1rem",
              padding: "0.25rem 0.75rem",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 搜索和添加区域 */}
      <div className="filters" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="filter-item" style={{ flex: 1 }}>
          <label htmlFor="search">Search users:</label>
          <input
            id="search"
            type="text"
            placeholder="Search by username or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // 搜索时重置到第一页
            }}
          />
        </div>

        <button
          onClick={handleAddClick}
          style={{
            padding: "0.6rem 1rem",
            backgroundColor: "#2c7be5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            height: "fit-content",
            minHeight: "38px"
          }}
        >
          + Add New User
        </button>
      </div>

      {/* 页面大小选择器 */}
      <PageSizeSelector pageSize={pageSize} onChange={handlePageSizeChange} />

      {/* 结果统计 */}
      <div style={{
        margin: "1rem 0",
        color: "#666",
        fontSize: "0.9rem",
        textAlign: "right"
      }}>
        Showing {((currentPage - 1) * pageSize) + 1} - {
          Math.min(currentPage * pageSize, filteredUsers.length)
        } of {filteredUsers.length} users
      </div>

      {/* 表格 */}
      <div className="table-container">
        <table className="locations-table" style={{ minWidth: "800px" }}>
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Username</th>
              <th style={{ width: "20%" }}>Role</th>
              <th style={{ width: "20%" }}>2FA Status</th>
              <th style={{ width: "20%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr key={user._id || user.username}>
                  <td>
                    {user.username}
                    {user.username === currentUser?.username && (
                      <span style={{ 
                        marginLeft: "0.5rem", 
                        backgroundColor: "#2c7be5", 
                        color: "white", 
                        padding: "0.1rem 0.4rem", 
                        borderRadius: "3px",
                        fontSize: "0.75rem"
                      }}>
                        You
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: user.role === 'admin' ? "#dc3545" : "#28a745",
                      color: "white",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.85rem"
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.twoFactorEnabled ? (
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>Enabled</span>
                    ) : (
                      <span style={{ color: "#6c757d" }}>Disabled</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        style={{
                          backgroundColor: "#ffc107",
                          border: "none",
                          padding: "0.4rem 0.7rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </button>
                      {user.twoFactorEnabled && user.role !== 'admin' && (
                        <button
                          style={{
                            backgroundColor: "#17a2b8",
                            border: "none",
                            padding: "0.4rem 0.7rem",
                            borderRadius: "4px",
                            color: "white",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                          onClick={() => handleReset2FA(user.username)}
                        >
                          Reset 2FA
                        </button>
                      )}
                      <button
                        style={{
                          backgroundColor: "#dc3545",
                          border: "none",
                          padding: "0.4rem 0.7rem",
                          borderRadius: "4px",
                          color: "white",
                          cursor: user.username === currentUser?.username ? "not-allowed" : "pointer",
                          whiteSpace: "nowrap",
                          opacity: user.username === currentUser?.username ? 0.6 : 1
                        }}
                        onClick={() => handleDelete(user.username)}
                        disabled={user.username === currentUser?.username}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-results">
                  {search ? "No users match your search" : "No users found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* 用户模态框 */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={editingUser}
      />
    </main>
  );
};

export default AdminUsersPage;