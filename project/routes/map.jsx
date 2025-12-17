import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修正 Leaflet 默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 模拟数据
const mockLocations = [
  { id: '3110031', name: 'Hong Kong Cultural Centre', latitude: 22.2933, longitude: 114.1699, area: 'North District', eventNum: 5 },
  { id: '3110267', name: 'Hong Kong City Hall', latitude: 22.2819, longitude: 114.1586, area: 'North District', eventNum: 8 },
  { id: '3110565', name: 'Ko Shan Theatre', latitude: 22.3367, longitude: 114.1875, area: 'Tai Po District', eventNum: 3 },
  { id: '35510043', name: 'Kwai Tsing Theatre', latitude: 22.3536, longitude: 114.1011, area: 'Tai Po District', eventNum: 6 },
  { id: '35510044', name: 'Sai Wan Ho Civic Centre', latitude: 22.2822, longitude: 114.2292, area: 'Tai Po District', eventNum: 4 },
  { id: '35511887', name: 'Ngau Chi Wan Civic Centre', latitude: 22.3358, longitude: 114.2092, area: 'Tai Po District', eventNum: 7 },
  { id: '35517396', name: 'Yuen Long Theatre', latitude: 22.4450, longitude: 114.0269, area: 'Tai Po District', eventNum: 5 },
  { id: '35517495', name: 'Tuen Mun Town Hall', latitude: 22.3958, longitude: 113.9731, area: 'Tai Po District', eventNum: 6 },
  { id: '36310304', name: 'Sha Tin Town Hall', latitude: 22.3808, longitude: 114.1869, area: 'Sha Tin District', eventNum: 10 },
  { id: '36310566', name: 'Tai Po Civic Centre', latitude: 22.4481, longitude: 114.1669, area: 'Sha Tin District', eventNum: 4 }
];

// 内联样式组件
const Styles = () => (
  <style>
    {`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: Arial, sans-serif;
        height: 100vh;
        overflow: hidden;
      }
      
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      
      header {
        background: #2c3e50;
        color: white;
        padding: 10px 20px;
      }
      
      h1 {
        font-size: 20px;
      }
      
      .container {
        display: flex;
        flex: 1;
        height: calc(100vh - 60px);
      }
      
      #sidebar {
        width: 300px;
        background: #f5f5f5;
        border-right: 1px solid #ddd;
        overflow-y: auto;
        padding: 10px;
      }
      
      #map {
        flex: 1;
      }
      
      .location-item {
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        background: white;
        cursor: pointer;
      }
      
      .location-item:hover {
        background: #f0f0f0;
      }
      
      .location-name {
        font-weight: bold;
        color: #2c3e50;
      }
      
      .location-details {
        font-size: 12px;
        color: #666;
        margin-top: 5px;
      }
      
      .location-link {
        display: inline-block;
        margin-top: 5px;
        color: #3498db;
        text-decoration: none;
        font-size: 12px;
      }
      
      .location-link:hover {
        text-decoration: underline;
      }
      
      .back-btn {
        background: #2c3e50;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-bottom: 20px;
      }
      
      .marker-popup .leaflet-popup-content {
        min-width: 200px;
      }
      
      .popup-link {
        display: block;
        margin-top: 10px;
        color: #3498db;
        text-decoration: none;
      }
      
      .popup-link:hover {
        text-decoration: underline;
      }
      
      /* 路由相关的样式 */
      .view {
        display: none;
        width: 100%;
        height: 100%;
      }
      
      .view.active {
        display: block;
      }
      
      #map-view.active {
        display: flex;
      }
      
      #detail-view {
        padding: 20px;
        overflow-y: auto;
        height: calc(100vh - 60px);
      }
      
      /* Leaflet 地图容器样式 */
      .leaflet-container {
        height: 100%;
        width: 100%;
      }
    `}
  </style>
);

function App() {
  return (
    <>
      <Styles />
      <Router>
        <div className="app-container">
          <Header />
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/location/:id" element={<LocationDetail />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

function Header() {
  return (
    <header>
      <h1>Cultural Events - SPA Map View</h1>
      <div>Single Page Application with browser history support</div>
    </header>
  );
}

function MapView() {
  const [locations, setLocations] = useState(mockLocations);
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);

  // 初始化地图
  useEffect(() => {
    if (mapRef.current) {
      setMap(mapRef.current);
    }
  }, []);

  // 加载数据
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch('/api/map/locations');
        const data = await response.json();
        setLocations(data);
      } catch (error) {
        console.log('Using mock data');
        setLocations(mockLocations);
      }
    };
    loadLocations();
  }, []);

  // 聚焦到特定位置
  const focusOnLocation = (lat, lng) => {
    if (map) {
      map.flyTo([lat, lng], 15);
    }
  };

  return (
    <div id="map-view" className="view active">
      <div className="container">
        <Sidebar 
          locations={locations} 
          onLocationClick={focusOnLocation}
        />
        <div id="map">
          <MapContainer
            center={[22.3193, 114.1694]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            whenCreated={setMap}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              maxZoom={18}
            />
            {locations.map(location => (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
              >
                <Popup className="marker-popup">
                  <div>
                    <strong>{location.name}</strong><br />
                    Events: {location.eventNum || 0}<br />
                    Area: {location.area || 'N/A'}<br />
                    <a href={`#/location/${location.id}`} className="popup-link">
                      View Location Details
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ locations, onLocationClick }) {
  const navigate = useNavigate();

  const handleLocationLinkClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/location/${id}`);
  };

  return (
    <div id="sidebar">
      <h3>Locations List</h3>
      <div id="locations-list">
        {locations.map(location => (
          <div 
            key={location.id} 
            className="location-item"
            onClick={() => onLocationClick(location.latitude, location.longitude)}
          >
            <div className="location-name">{location.name}</div>
            <div className="location-details">
              Events: {location.eventNum || 0} | 
              Area: {location.area || 'N/A'}
            </div>
            <a 
              href={`#/location/${location.id}`}
              className="location-link"
              onClick={(e) => handleLocationLinkClick(e, location.id)}
            >
              View Details
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLocationDetails = async () => {
      try {
        setLoading(true);
        // 尝试从API获取数据
        const response = await fetch(`/api/location/${id}`);
        if (response.ok) {
          const data = await response.json();
          setLocation(data.location);
        } else {
          // 如果API失败，使用模拟数据
          const foundLocation = mockLocations.find(loc => loc.id === id);
          if (foundLocation) {
            setLocation(foundLocation);
          } else {
            throw new Error('Location not found');
          }
        }
      } catch (error) {
        console.error('Error loading location details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadLocationDetails();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div id="detail-view" className="view active">
        <button className="back-btn" onClick={handleBack}>← Back to Map</button>
        <div id="detail-content">
          <p>Loading location details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="detail-view" className="view active">
        <button className="back-btn" onClick={handleBack}>← Back to Map</button>
        <div id="detail-content">
          <h2>Error</h2>
          <p>Failed to load location details: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="detail-view" className="view active">
      <button className="back-btn" onClick={handleBack}>← Back to Map</button>
      <div id="detail-content">
        <h2>{location.name}</h2>
        <p><strong>ID:</strong> {location.id}</p>
        <p><strong>Coordinates:</strong> {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}</p>
        <p><strong>Area:</strong> {location.area || 'N/A'} </p>
        <p><strong>Number of Events:</strong> {location.eventNum || 0}</p>
      </div>
    </div>
  );
}

export default App;