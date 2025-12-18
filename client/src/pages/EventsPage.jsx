import React, { useState, useEffect, useMemo } from "react";
import "../styles/locations.css";

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

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
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
      
      // Fetch events (public endpoint, no credentials needed)
      const resEvents = await fetch("/events", {
        headers: { "Content-Type": "application/json" },
      });

      if (!resEvents.ok) {
        throw new Error(`Failed to fetch events: ${resEvents.status}`);
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
        <h2>Upcoming Events</h2>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "200px" 
        }}>
          <p>Loading events...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="locations-page">
      <h2>Upcoming Events</h2>

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

      {/* === 搜索区域 === */}
      <div className="filters" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="filter-item" style={{ flex: 1 }}>
          <label htmlFor="search">Search events:</label>
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
              <th style={{ width: "20%" }}>Title</th>
              <th style={{ width: "25%" }}>Description</th>
              <th style={{ width: "15%" }}>Venue</th>
              <th style={{ width: "15%" }}>Presenter</th>
              <th style={{ width: "20%" }}>Time</th>
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
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
    </main>
  );
};

export default EventsPage;