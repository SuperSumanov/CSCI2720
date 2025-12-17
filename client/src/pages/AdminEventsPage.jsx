import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/locations.css"; // reuse same style

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  

  // === Load events and locations on mount ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch events
        const resEvents = await fetch("http://localhost:3000/admin/events", {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        console.log("Event fetch status:", resEvents.status);

        if (!resEvents.ok) throw new Error("Failed to fetch events");
        const dataEvents = await resEvents.json();
        console.log("Fetched events:", dataEvents);

        // Fetch locations for venue lookup
        const resLoc = await fetch("http://localhost:3000/locations", {
          headers: { "Content-Type": "application/json" },
        });
        const dataLoc = resLoc.ok ? await resLoc.json() : [];

        setEvents(dataEvents);
        setLocations(dataLoc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // === Search filter ===
  const filteredEvents = useMemo(() => {
    return events.filter((ev) =>
      ev.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [events, search]);

  // === Helper to get venue name by locid ===
  const getVenueName = (locId) => {
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : "Unknown";
  };

  // === Add / Update / Delete actions ===
  const handleAdd = async () => {
    const title = prompt("Enter new event title:");
    if (!title) return;
    const description = prompt("Enter description:") || "";
    const presenter = prompt("Enter presenter:") || "";
    const time = prompt("Enter time (YYYY-MM-DD HH:mm):") || "";
    const locid = prompt("Enter location ID:") || "";

    try {
      const res = await fetch("http://localhost:3000/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: title, description, presenter, time, locId: locid }),
      });
      if (!res.ok) throw new Error("Failed to add event");
      const newEvent = await res.json();
      setEvents((prev) => [...prev, newEvent]);
    } catch (err) {
      console.error(err);
      alert("Error adding event");
    }
  };

  const handleUpdate = async (id) => {
    const event = events.find((ev) => ev.id === id);
    if (!event) return alert("Event not found");

    const title = prompt("Edit title:", event.title);
    const description = prompt("Edit description:", event.description);
    const presenter = prompt("Edit presenter:", event.presenter);
    const time = prompt("Edit time:", event.time);
    const locid = prompt("Edit location ID:", event.locid);

    try {
      const res = await fetch(`http://localhost:3000/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: title, description, presenter, time, locId: locid }),
      });
      if (!res.ok) throw new Error("Failed to update event");
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      console.error(err);
      alert("Error updating event");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`http://localhost:3000/admin/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting event");
    }
  };

  if (loading) {
    return (
      <main className="locations-page">
        <h2>Admin Events</h2>
        <p>Loading events from server...</p>
      </main>
    );
  }

  return (
    <main className="locations-page">
      <h2>Admin Events</h2>

      {/* === Search & Add Section === */}
      <div className="filters" style={{ justifyContent: "space-between" }}>
        <div className="filter-item" style={{ flex: 1 }}>
          <label htmlFor="search">Search event title:</label>
          <input
            id="search"
            type="text"
            placeholder="Enter event title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={handleAdd}
          style={{
            padding: "0.6rem 1rem",
            backgroundColor: "#2c7be5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            height: "fit-content",
            marginTop: "1.5rem",
          }}
        >
          + Add New Event
        </button>
      </div>

      {/* === Table === */}
      <div className="table-container">
        <table className="locations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Venue</th>
              <th>Presenter</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.id}</td>
                  <td>{ev.name}</td>
                  <td>{ev.description}</td>
                  <td>{getVenueName(ev.locId)}</td>
                  <td>{ev.presenter}</td>
                  <td>{ev.time}</td>
                  <td>
                    <button
                      style={{
                        marginRight: "0.5rem",
                        backgroundColor: "#ffc107",
                        border: "none",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleUpdate(ev.id)}
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
                      }}
                      onClick={() => handleDelete(ev.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  No events found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default AdminEventsPage;