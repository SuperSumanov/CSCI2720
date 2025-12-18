import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/locations.css";

// 添加模态框组件
const EventModal = ({ isOpen, onClose, onSubmit, event = null, locations = [] }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    presenter: "",
    time: "",
    locId: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        description: event.description || "",
        presenter: event.presenter || "",
        time: event.time || "",
        locId: event.locId || ""
      });
    } else {
      setFormData({
        name: "",
        description: "",
        presenter: "",
        time: "",
        locId: ""
      });
    }
    setError("");
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save event");
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
          {event ? "Edit Event" : "Add New Event"}
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
              Event Title *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
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
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                resize: "vertical",
                backgroundColor: isSubmitting ? "#f8f9fa" : "white"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
              Presenter
            </label>
            <input
              type="text"
              name="presenter"
              value={formData.presenter}
              onChange={handleChange}
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
              Time (YYYY-MM-DD HH:mm) *
            </label>
            <input
              type="text"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="2024-12-25 14:30"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: isSubmitting ? "#f8f9fa" : "white"
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "600" }}>
              Venue (Location) *
            </label>
            <select
              name="locId"
              value={formData.locId}
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
              <option value="">Select a venue</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
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
              {event ? "Update" : "Add"} Event
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

// 描述文本组件，支持折叠/展开
const DescriptionText = ({ text, maxLength = 100 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return <span style={{ color: "#999" }}>No description</span>;
  
  const shouldTruncate = text.length > maxLength && !isExpanded;
  const displayText = shouldTruncate ? text.substring(0, maxLength) + "..." : text;
  
  return (
    <div>
      <span>{displayText}</span>
      {text.length > maxLength && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            marginLeft: "0.5rem",
            color: "#2c7be5",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.85rem",
            textDecoration: "underline"
          }}
        >
          {isExpanded ? "less" : "more"}
        </button>
      )}
    </div>
  );
};

// 分页组件
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

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [fetchError, setFetchError] = useState("");
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // === Load events and locations on mount ===
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setFetchError("");
      
      // Fetch events
      const resEvents = await fetch("/admin/events", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!resEvents.ok) {
        if (resEvents.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (resEvents.status === 403) {
          throw new Error("You don't have permission to access this page.");
        } else {
          throw new Error(`Failed to fetch events: ${resEvents.status}`);
        }
      }
      
      const dataEvents = await resEvents.json();

      // Fetch locations for venue lookup
      const resLoc = await fetch("/locations", {
        headers: { "Content-Type": "application/json" },
      });
      const dataLoc = resLoc.ok ? await resLoc.json() : [];

      setEvents(dataEvents);
      setLocations(dataLoc);
    } catch (err) {
      console.error("Error fetching data:", err);
      setFetchError(err.message || "Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // === Search filter ===
  const filteredEvents = useMemo(() => {
    return events.filter((ev) =>
      ev.name?.toLowerCase().includes(search.toLowerCase()) ||
      ev.description?.toLowerCase().includes(search.toLowerCase()) ||
      ev.presenter?.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  // === 计算分页数据 ===
  useEffect(() => {
    const total = Math.ceil(filteredEvents.length / pageSize);
    setTotalPages(total > 0 ? total : 1);
    
    // 如果当前页超过总页数，跳转到第一页
    if (currentPage > total && total > 0) {
      setCurrentPage(1);
    }
  }, [filteredEvents, pageSize, currentPage]);

  // === 获取当前页的数据 ===
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredEvents.slice(startIndex, endIndex);
  }, [filteredEvents, currentPage, pageSize]);

  // === Helper to get venue name by locid ===
  const getVenueName = (locId) => {
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : "Unknown";
  };

  // === Modal handlers ===
  const handleAddClick = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEditClick = (event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    try {
      let res;
      let method;
      let url;
      
      if (editingEvent) {
        // Update existing event
        method = "PUT";
        url = `/admin/events/${editingEvent.id}`;
      } else {
        // Add new event
        method = "POST";
        url = `/admin/events`;
      }
      
      res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || `Failed to ${editingEvent ? 'update' : 'add'} event`);
      }
      
      // 重新获取数据以确保与数据库同步
      await fetchEvents();
      
    } catch (err) {
      console.error("Error saving event:", err);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete event");
      }
      
      // 重新获取数据以确保与数据库同步
      await fetchEvents();
      
    } catch (err) {
      console.error("Error deleting event:", err);
      alert(`Error deleting event: ${err.message}`);
    }
  };

  // === 分页处理函数 ===
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

  if (loading) {
    return (
      <main className="locations-page">
        <h2>Admin Events</h2>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "200px" 
        }}>
          <p>Loading events from server...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="locations-page">
      <h2>Admin Events</h2>

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
            onClick={fetchEvents}
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

      {/* === 搜索和添加区域 === */}
      <div className="filters" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="filter-item" style={{ flex: 1 }}>
          <label htmlFor="search">Search event title:</label>
          <input
            id="search"
            type="text"
            placeholder="Search by title, description, or presenter..."
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
          + Add New Event
        </button>
      </div>

      {/* === 页面大小选择器 === */}
      <PageSizeSelector pageSize={pageSize} onChange={handlePageSizeChange} />

      {/* === 结果统计 === */}
      <div style={{
        margin: "1rem 0",
        color: "#666",
        fontSize: "0.9rem",
        textAlign: "right"
      }}>
        Showing {((currentPage - 1) * pageSize) + 1} - {
          Math.min(currentPage * pageSize, filteredEvents.length)
        } of {filteredEvents.length} events
      </div>

      {/* === 表格 === */}
      <div className="table-container">
        <table className="locations-table" style={{ minWidth: "1000px" }}>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>ID</th>
              <th style={{ width: "15%" }}>Title</th>
              <th style={{ width: "25%" }}>Description</th>
              <th style={{ width: "15%" }}>Venue</th>
              <th style={{ width: "15%" }}>Presenter</th>
              <th style={{ width: "15%" }}>Time</th>
              <th style={{ width: "10%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEvents.length > 0 ? (
              paginatedEvents.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.id.substring(0, 8)}...</td>
                  <td>{ev.name}</td>
                  <td>
                    <DescriptionText text={ev.description} maxLength={80} />
                  </td>
                  <td>{getVenueName(ev.locId)}</td>
                  <td>{ev.presenter || "-"}</td>
                  <td>{ev.time}</td>
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
                        onClick={() => handleEditClick(ev)}
                      >
                        Update
                      </button>
                      <button
                        style={{
                          backgroundColor: "#dc3545",
                          border: "none",
                          padding: "0.4rem 0.7rem",
                          borderRadius: "4px",
                          color: "white",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                        onClick={() => handleDelete(ev.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  {search ? "No events match your search" : "No events found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === 分页 === */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Event Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        event={editingEvent}
        locations={locations}
      />
    </main>
  );
};

export default AdminEventsPage;