import React, { useState, useEffect, useMemo } from "react";
import "../styles/locations.css";

const FavouritesPage = () => {
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [favoriteCounts, setFavoriteCounts] = useState({});

  // 获取当前用户信息（通过API检查登录状态）
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3000/login/me", {
          credentials: 'include',
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 获取所有地点数据
  useEffect(() => {
    const fetchAllLocations = async () => {
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
        
        // 获取每个地点的收藏数量
        const countsPromises = data.map(async (loc) => {
          try {
            const countRes = await fetch(`http://localhost:3000/favorite/loc-num/${loc.id}`);
            if (countRes.ok) {
              const countData = await countRes.json();
              return { id: loc.id, count: countData.favoriteCount };
            }
            return { id: loc.id, count: 0 };
          } catch (err) {
            console.error(`Error fetching favorite count for ${loc.id}:`, err);
            return { id: loc.id, count: 0 };
          }
        });

        const countsResults = await Promise.all(countsPromises);
        const countsMap = {};
        countsResults.forEach(result => {
          countsMap[result.id] = result.count;
        });
        setFavoriteCounts(countsMap);

        // 添加事件数量（实际应用中应该从后端获取）
        const enriched = data.map((loc) => ({
          id: loc.id,
          name: loc.name,
          events: Math.floor(Math.random() * 10) + 1,
          area: loc.area || "Unknown",
        }));

        setAllLocations(enriched);
      } catch (err) {
        console.error("Error fetching /locations:", err);
      }
    };

    fetchAllLocations();
  }, []);

  // 获取用户的收藏列表
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/favorite/my-all", {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            console.warn("User not authenticated for favorites");
            setFavoriteLocations([]);
            setLoading(false);
            return;
          }
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();
        
        // 提取收藏的地点信息
        const favorites = data
          .filter(item => item.location) // 只保留有地点信息的
          .map(item => {
            const locationInfo = allLocations.find(loc => loc.id === item.locationId);
            return {
              favoriteId: item.favoriteId || item._id,
              locationId: item.locationId,
              name: item.location?.name || locationInfo?.name || "Unknown",
              events: locationInfo?.events || Math.floor(Math.random() * 10) + 1,
              area: item.location?.area || locationInfo?.area || "Unknown",
              favoriteCount: favoriteCounts[item.locationId] || 0,
              timestamp: item.timestamp,
            };
          });

        setFavoriteLocations(favorites);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setFavoriteLocations([]);
        setLoading(false);
      }
    };

    if (user) {
      fetchFavorites();
    }
  }, [user, allLocations, favoriteCounts]);

  // 取消收藏函数
  const handleRemoveFavorite = async (locationId, favoriteId) => {
    try {
      const res = await fetch(`http://localhost:3000/favorite/${locationId}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 404) {
          console.warn("Favorite not found, removing from local state");
        } else if (res.status === 401 || res.status === 403) {
          alert("Please login to manage favorites");
          return;
        } else {
          throw new Error(`Failed to remove favorite: ${res.status}`);
        }
      }

      // 从状态中移除
      setFavoriteLocations(prev => 
        prev.filter(fav => 
          fav.favoriteId !== favoriteId && fav.locationId !== locationId
        )
      );

      // 更新收藏数量
      setFavoriteCounts(prev => ({
        ...prev,
        [locationId]: Math.max(0, (prev[locationId] || 0) - 1)
      }));

      console.log("Favorite removed successfully");
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("Failed to remove favorite. Please try again.");
    }
  };

  // 清空所有收藏
  const handleClearAllFavorites = async () => {
    if (!window.confirm("Are you sure you want to remove all favorites?")) {
      return;
    }

    try {
      const removePromises = favoriteLocations.map(location => 
        fetch(`http://localhost:3000/favorite/${location.locationId}`, {
          method: "DELETE",
          credentials: 'include',
        })
      );

      const results = await Promise.allSettled(removePromises);
      
      const failed = results.filter(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.ok)
      );

      if (failed.length > 0) {
        console.warn(`${failed.length} favorites failed to remove`);
      }

      // 清空所有收藏
      setFavoriteLocations([]);
      
      // 重置所有收藏数量
      const resetCounts = { ...favoriteCounts };
      favoriteLocations.forEach(loc => {
        resetCounts[loc.locationId] = Math.max(0, (resetCounts[loc.locationId] || 0) - 1);
      });
      setFavoriteCounts(resetCounts);

      alert("All favorites removed successfully");
    } catch (err) {
      console.error("Error clearing all favorites:", err);
      alert("Failed to remove all favorites. Please try again.");
    }
  };

  // 根据搜索词过滤收藏的地点
  const filteredFavorites = useMemo(() => {
    if (!search.trim()) {
      return favoriteLocations;
    }

    const searchTerm = search.toLowerCase().trim();
    return favoriteLocations.filter(loc =>
      loc.name?.toLowerCase().includes(searchTerm) ||
      loc.area?.toLowerCase().includes(searchTerm)
    );
  }, [favoriteLocations, search]);

  // 计算收藏统计
  const stats = useMemo(() => {
    const total = favoriteLocations.length;
    const uniqueAreas = new Set(favoriteLocations.map(loc => loc.area)).size;
    const totalEvents = favoriteLocations.reduce((sum, loc) => sum + (loc.events || 0), 0);
    
    return { total, uniqueAreas, totalEvents };
  }, [favoriteLocations]);

  // 如果没有用户登录，显示提示信息
  if (!user && !loading) {
    return (
      <main className="locations-page">
        <h2>⭐ Your Favourite Locations</h2>
        <div className="login-prompt">
          <p>Please log in to view your favorite locations.</p>
          <a href="/login" className="login-link">Log in →</a>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="locations-page">
        <h2>⭐ Your Favourite Locations</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your favorites...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="locations-page">
      <h2>⭐ Your Favourite Locations</h2>

      {/* 收藏统计 */}
      {favoriteLocations.length > 0 && (
        <div className="favorites-stats">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Favorites</p>
          </div>
          <div className="stat-card">
            <h3>{stats.uniqueAreas}</h3>
            <p>Areas</p>
          </div>
          <div className="stat-card">
            <h3>{stats.totalEvents}</h3>
            <p>Total Events</p>
          </div>
        </div>
      )}

      {/* 搜索框和操作 */}
      <div className="filters">
        <div className="filter-item">
          <label htmlFor="search">Search in favorites:</label>
          <input
            id="search"
            type="text"
            placeholder="Search location name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {favoriteLocations.length > 0 && (
          <div className="filter-actions">
            <button
              className="clear-all-btn"
              onClick={handleClearAllFavorites}
              title="Remove all favorites"
            >
              🗑️ Clear All
            </button>
            {search.trim() && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* 收藏列表 */}
      <div className="table-container">
        {filteredFavorites.length > 0 ? (
          <table className="locations-table">
            <thead>
              <tr>
                <th>Location Name</th>
                <th>Events</th>
                <th>Area</th>
                <th>Popularity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFavorites.map((location) => (
                <tr key={location.favoriteId || location.locationId}>
                  <td>
                    <div className="location-name">
                      <strong>{location.name}</strong>
                      {location.timestamp && (
                        <span className="favorite-date">
                          Added: {new Date(location.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="events-count">{location.events}</span>
                  </td>
                  <td>
                    <span className="area-badge">{location.area}</span>
                  </td>
                  <td>
                    <div className="popularity-indicator">
                      <span className="star-count">⭐ {location.favoriteCount || 0}</span>
                      <div className="popularity-bar">
                        <div 
                          className="popularity-fill"
                          style={{ 
                            width: `${Math.min(100, (location.favoriteCount || 0) * 20)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFavorite(location.locationId, location.favoriteId)}
                      title="Remove from favorites"
                    >
                      Remove ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : search.trim() ? (
          <div className="no-results">
            <p>No favorites found matching "{search}".</p>
            <button 
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="no-favorites">
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <h3>No favorites yet</h3>
              <p>You haven't added any locations to favorites yet.</p>
              <a href="/locations" className="browse-link">
                Browse Locations →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 显示数量信息 */}
      {favoriteLocations.length > 0 && (
        <div className="favorites-footer">
          <p>
            Showing <strong>{filteredFavorites.length}</strong> of{" "}
            <strong>{favoriteLocations.length}</strong> favorite locations
            {search.trim() && ` matching "${search}"`}
          </p>
        </div>
      )}
    </main>
  );
};

export default FavouritesPage;