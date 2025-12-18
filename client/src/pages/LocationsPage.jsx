import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom'; // 新增：导入 useNavigate
import "../styles/locations.css";

const LocationsPage = () => {
  const navigate = useNavigate(); // 新增：使用 useNavigate 钩子
  const [allLocations, setAllLocations] = useState([]);
  const [sortKey, setSortKey] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [maxDistance, setMaxDistance] = useState(20);
  const [selectedArea, setSelectedArea] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 新增：处理地点点击事件
  const handleLocationClick = (locationId, locationName) => {
    // 跳转到地图页面，并传递选中地点的ID和名称
    navigate('/map', { 
      state: { 
        selectedLocationId: locationId,
        fromLocationsPage: true,
        locationName: locationName
      } 
    });
  };

  // === Check user authentication status ===
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3000/login/me", {
          credentials: 'include',
        });
        
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  // === Fetch data from backend on mount ===
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch("http://localhost:3000/locations", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        const enriched = data.map((loc, index) => ({
          id: loc.id || index + 1,
          name: loc.name,
          distance: Math.random() * 20,
          events: Math.floor(Math.random() * 10) + 1,
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

  // === Fetch user's favorites from backend ===
  useEffect(() => {
    const fetchUserFavorites = async () => {
      if (!isLoggedIn) {
        setFavorites([]);
        setLoadingFavorites(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/favorite/my-all", {
          credentials: 'include',
        });

        if (res.status === 401 || res.status === 403) {
          console.warn("User not authenticated for favorites");
          setFavorites([]);
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch favorites: ${res.status}`);
        }

        const data = await res.json();
        const favoriteIds = data.map(fav => fav.locationId);
        setFavorites(favoriteIds);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    if (isLoggedIn) {
      fetchUserFavorites();
    } else {
      setLoadingFavorites(false);
    }
  }, [isLoggedIn]);

  // Toggle favorite - calls backend API
  const toggleFavorite = async (locationId, e) => {
    if (e) {
      e.stopPropagation(); // 新增：阻止事件冒泡
    }
    
    if (!isLoggedIn) {
      alert("Please login to add favorites");
      return;
    }

    const isCurrentlyFavorite = favorites.includes(locationId);
    
    try {
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const res = await fetch(`http://localhost:3000/favorite/${locationId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res.status === 401 || res.status === 403) {
          alert("Please login to manage favorites");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to remove favorite: ${res.status}`);
        }

        setFavorites(prev => prev.filter(id => id !== locationId));
      } else {
        // Add to favorites
        const res = await fetch(`http://localhost:3000/favorite/${locationId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 401 || res.status === 403) {
          alert("Please login to manage favorites");
          return;
        }

        if (res.status === 409) {
          alert("This location is already in your favorites");
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to add favorite: ${res.status}`);
        }

        setFavorites(prev => [...prev, locationId]);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert("Failed to update favorite. Please try again.");
    }
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
        <p>Loading...</p>
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
                <tr 
                  key={loc.id}
                  className="location-row" // 新增：添加类名用于样式
                  onClick={() => handleLocationClick(loc.id, loc.name)} // 新增：行点击事件
                  style={{ cursor: 'pointer' }} // 新增：鼠标指针样式
                >
                  <td>{loc.id}</td>
                  <td>{loc.name}</td>
                  <td>{loc.distance.toFixed(1)}</td>
                  <td>{loc.events}</td>
                  <td>{loc.area}</td>
                  <td>
                    <button
                      className={`fav-btn ${
                        favorites.includes(loc.id) ? "active" : ""
                      } ${!isLoggedIn ? "disabled" : ""}`}
                      onClick={(e) => toggleFavorite(loc.id, e)} // 修改：传递事件对象
                      disabled={loadingFavorites || !isLoggedIn}
                      title={!isLoggedIn ? "Login to add favorites" : ""}
                    >
                      {loadingFavorites ? "..." : (favorites.includes(loc.id) ? "⭐" : "☆")}
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
