import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

// 内联样式
const mapStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    background: '#2c3e50',
    color: 'white',
    padding: '10px 20px',
  },
  headerTitle: {
    fontSize: '20px',
    margin: 0,
  },
  viewContainer: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 60px)',
  },
  sidebar: {
    width: '300px',
    background: '#f5f5f5',
    borderRight: '1px solid #ddd',
    overflowY: 'auto',
    padding: '10px',
  },
  mapContainer: {
    flex: 1,
  },
  locationItem: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '10px',
    background: 'white',
    cursor: 'pointer',
  },
  locationItemHover: {
    background: '#f0f0f0',
  },
  locationName: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  locationDetails: {
    fontSize: '12px',
    color: '#666',
    marginTop: '5px',
  },
  locationLink: {
    display: 'inline-block',
    marginTop: '5px',
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '12px',
  },
  backButton: {
    background: '#2c3e50',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  detailView: {
    padding: '20px',
    overflowY: 'auto',
    height: 'calc(100vh - 60px)',
  },
  markerPopup: {
    minWidth: '200px',
  },
  popupLink: {
    display: 'block',
    marginTop: '10px',
    color: '#3498db',
    textDecoration: 'none',
  },
};

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

// 地图页面组件
const MapPage = () => {
  const [viewMode, setViewMode] = useState('map'); // 'map' 或 'detail'
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState(mockLocations);
  const [mapInstance, setMapInstance] = useState(null);
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();

  // 初始化地图
  useEffect(() => {
    if (mapRef.current) {
      setMapInstance(mapRef.current);
    }
  }, []);

  // 加载位置数据
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

  // 处理路由参数
  useEffect(() => {
    if (params.locationId) {
      showLocationDetail(params.locationId);
    } else {
      showMapView();
    }
  }, [params.locationId]);

  // 显示地图视图
  const showMapView = () => {
    setViewMode('map');
    setSelectedLocation(null);
    
    // 确保地图正确显示
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 100);
    }
  };

  // 显示位置详情
  const showLocationDetail = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      setViewMode('detail');
    } else {
      // 如果找不到位置，返回地图视图
      showMapView();
    }
  };

  // 聚焦到特定位置
  const focusOnLocation = (lat, lng) => {
    if (mapInstance) {
      mapInstance.flyTo([lat, lng], 15);
    }
  };

  // 处理位置链接点击
  const handleLocationLinkClick = (e, locationId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/location/${locationId}`);
  };

  // 处理返回按钮
  const handleBack = () => {
    navigate(-1);
  };

  // 渲染地图视图
  const renderMapView = () => (
    <div style={mapStyles.viewContainer}>
      <div style={mapStyles.sidebar}>
        <h3>Locations List</h3>
        <div id="locations-list">
          {locations.map(location => (
            <div 
              key={location.id} 
              style={mapStyles.locationItem}
              onMouseEnter={(e) => e.currentTarget.style.background = mapStyles.locationItemHover.background}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              onClick={() => focusOnLocation(location.latitude, location.longitude)}
            >
              <div style={mapStyles.locationName}>{location.name}</div>
              <div style={mapStyles.locationDetails}>
                Events: {location.eventNum || 0} | 
                Area: {location.area || 'N/A'}
              </div>
              <a 
                href={`#/location/${location.id}`}
                style={mapStyles.locationLink}
                onClick={(e) => handleLocationLinkClick(e, location.id)}
              >
                View Details
              </a>
            </div>
          ))}
        </div>
      </div>
      <div style={mapStyles.mapContainer}>
        <MapContainer
          center={[22.3193, 114.1694]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          whenCreated={setMapInstance}
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
              <Popup style={mapStyles.markerPopup}>
                <div>
                  <strong>{location.name}</strong><br />
                  Events: {location.eventNum || 0}<br />
                  Area: {location.area || 'N/A'}<br />
                  <a 
                    href={`#/location/${location.id}`}
                    style={mapStyles.popupLink}
                    onClick={(e) => handleLocationLinkClick(e, location.id)}
                  >
                    View Location Details
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );

  // 渲染详情视图
  const renderDetailView = () => {
    if (!selectedLocation) return null;
    
    return (
      <div style={mapStyles.detailView}>
        <button style={mapStyles.backButton} onClick={handleBack}>
          ← Back to Map
        </button>
        <div id="detail-content">
          <h2>{selectedLocation.name}</h2>
          <p><strong>ID:</strong> {selectedLocation.id}</p>
          <p><strong>Coordinates:</strong> {selectedLocation.latitude?.toFixed(4)}, {selectedLocation.longitude?.toFixed(4)}</p>
          <p><strong>Area:</strong> {selectedLocation.area || 'N/A'} </p>
          <p><strong>Number of Events:</strong> {selectedLocation.eventNum || 0}</p>
        </div>
      </div>
    );
  };

  return (
    <div style={mapStyles.container}>
      <header style={mapStyles.header}>
        <h1 style={mapStyles.headerTitle}>Cultural Events - SPA Map View</h1>
        <div>Single Page Application with browser history support</div>
      </header>
      
      {viewMode === 'map' ? renderMapView() : renderDetailView()}
    </div>
  );
};

export default MapPage;
