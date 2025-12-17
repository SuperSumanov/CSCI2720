import React, { useState, useEffect, useMemo } from "react";
import "../styles/locations.css";

const LocationsPage = () => {
  const [allLocations, setAllLocations] = useState([]); // ← dynamic data
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(20);
  const [selectedArea, setSelectedArea] = useState("All");
  const [loading, setLoading] = useState(true);

  // === Fetch data from backend on mount ===
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("http://localhost:3000/locations", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        // Adapt backend fields (id, name, latitude, longitude, area)
        // Compute a pseudo distance & events count if not provided, for display
        const enriched = data.map((loc, index) => ({
          id: loc.id || index + 1,
          name: loc.name,
          distance: Math.random() * 20, // demo distance; backend didn't define this
          events: Math.floor(Math.random() * 10) + 1, // demo event count
          area: loc.area || "Unknown",
        }));

        setAllLocations(enriched);
      } catch (err) {
        console.error("Error fetching /locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // === Favorites persist in localStorage ===
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const allAreas = useMemo(
    () => ["All", ...new Set(allLocations.map((l) => l.area))],
    [allLocations]
  );

  // === Filtering + sorting ===
  const filteredAndSorted = useMemo(() => {
    let list = allLocations.filter(
      (loc) =>
        loc.name?.toLowerCase().includes(search.toLowerCase()) &&
        loc.distance <= maxDistance &&
        (selectedArea === "All" || loc.area === selectedArea)
    );

    list.sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      if (sortKey === "distance") diff = a.distance - b.distance;
      if (sortKey === "events") diff = a.events - b.events;
      return sortOrder === "asc" ? diff : -diff;
    });

    return list;
  }, [allLocations, search, maxDistance, selectedArea, sortKey, sortOrder]);

  if (loading) {
    return (
      <main className="locations-page">
        <h2>Programme Locations</h2>
        <p>Loading locations from server...</p>
      </main>
    );
  }

  return (
    <main className="locations-page">
      <h2>Programme Locations</h2>

      {/* === FILTER BLOCK === */}
      <div className="filters">
        {/* Search */}
        <div className="filter-item">
          <label htmlFor="search">Search:</label>
          <input
            id="search"
            type="text"
            placeholder="Search location name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Distance slider */}
        <div className="filter-item">
          <label htmlFor="distance">
            Max Distance: <strong>{maxDistance} km</strong>
          </label>
          <input
            id="distance"
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
          />
        </div>

        {/* Area selector */}
        <div className="filter-item">
          <label htmlFor="area">Area:</label>
          <select
            id="area"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            {allAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* === TABLE === */}
      <div className="table-container">
        <table className="locations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th onClick={() => handleSort("name")}>
                Location {sortKey === "name" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("distance")}>
                Distance (km){" "}
                {sortKey === "distance" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("events")}>
                Events {sortKey === "events" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th>Area</th>
              <th>Favorite</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length > 0 ? (
              filteredAndSorted.map((loc) => (
                <tr key={loc.id}>
                  <td>{loc.id}</td>
                  <td>{loc.name}</td>
                  <td>{loc.distance.toFixed(1)}</td>
                  <td>{loc.events}</td>
                  <td>{loc.area}</td>
                  <td>
                    <button
                      className={`fav-btn ${
                        favorites.includes(loc.id) ? "active" : ""
                      }`}
                      onClick={() => toggleFavorite(loc.id)}
                    >
                      {favorites.includes(loc.id) ? "⭐" : "☆"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No locations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default LocationsPage;