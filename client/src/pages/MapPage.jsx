import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isCommentsPaneOpen, setIsCommentsPaneOpen] = useState(false);
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    const API_BASE_URL = 'http://localhost:3000';

    // Test backend connection
    const testBackendConnection = async () => {
        try {
            console.log('Testing backend connection...');
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`Backend server responded with error: ${response.status}`);
            }
            console.log('Backend server connection successful');
            return true;
        } catch (error) {
            console.error('Backend connection failed:', error.message);
            return false;
        }
    };

    // Helper function to calculate offset for overlapping markers
    const calculateOffset = (index, totalAtSameLocation) => {
        if (totalAtSameLocation <= 1) return { latOffset: 0, lngOffset: 0 };
        
        // Create a circular pattern for markers at same location
        const radius = 0.0005; // Small offset in degrees
        const angle = (2 * Math.PI * index) / totalAtSameLocation;
        
        return {
            latOffset: radius * Math.cos(angle),
            lngOffset: radius * Math.sin(angle)
        };
    };

    // Process locations to handle overlapping coordinates
    const processLocations = (rawLocations) => {
        const locationGroups = {};
        const processedLocations = [];
        
        // Group locations by coordinates
        rawLocations.forEach(location => {
            const key = `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
            if (!locationGroups[key]) {
                locationGroups[key] = [];
            }
            locationGroups[key].push(location);
        });
        
        // Apply offsets to overlapping locations
        Object.values(locationGroups).forEach(locationGroup => {
            if (locationGroup.length > 1) {
                console.log(`Found ${locationGroup.length} locations at same coordinates:`, 
                    `${locationGroup[0].latitude}, ${locationGroup[0].longitude}`);
            }
            
            locationGroup.forEach((location, index) => {
                const offset = calculateOffset(index, locationGroup.length);
                processedLocations.push({
                    ...location,
                    originalLatitude: location.latitude,
                    originalLongitude: location.longitude,
                    displayLatitude: location.latitude + offset.latOffset,
                    displayLongitude: location.longitude + offset.lngOffset,
                    isOffset: offset.latOffset !== 0 || offset.lngOffset !== 0,
                    groupSize: locationGroup.length,
                    groupIndex: index
                });
            });
        });
        
        return processedLocations;
    };

    // Fetch location data - robust version
    const fetchLocations = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            console.log('Fetching location data...');
            
            // Test connection first
            const isConnected = await testBackendConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to backend server');
            }
            
            // Try multiple possible endpoints
            const endpoints = [
                '/api/locations',
                '/locations',
                '/locations/all'
            ];
            
            let locationsData = [];
            let lastError = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Got ${data.length || 0} records from ${endpoint}`);
                        
                        if (Array.isArray(data) && data.length > 0) {
                            locationsData = data;
                            break;
                        }
                    }
                } catch (err) {
                    lastError = err;
                    console.log(`Endpoint ${endpoint} failed: ${err.message}`);
                }
            }
            
            if (locationsData.length === 0 && lastError) {
                throw lastError;
            }
            
            if (locationsData.length === 0) {
                console.warn('Got empty location data, using mock data');
                // Use mock data as fallback
                locationsData = getMockLocations();
            }
            
            // Data cleaning and validation
            const validLocations = locationsData
                .filter(loc => loc && 
                    loc.id && 
                    typeof loc.latitude === 'number' && 
                    typeof loc.longitude === 'number' &&
                    !isNaN(loc.latitude) && 
                    !isNaN(loc.longitude) &&
                    loc.area)
                .map(loc => ({
                    ...loc,
                    name: loc.name || `Location ${loc.id}`,
                    latitude: Number(loc.latitude),
                    longitude: Number(loc.longitude),
                    area: loc.area,
                    eventNum: loc.eventNum || 0
                }));
            
            console.log(`Valid location data: ${validLocations.length} records`);
            
            // Process locations to handle overlapping coordinates
            const processedLocations = processLocations(validLocations);
            setLocations(processedLocations);
            
            // Initialize map if there is valid data
            if (processedLocations.length > 0 && mapRef.current && !mapInstanceRef.current) {
                initMap(processedLocations);
            }
            
        } catch (error) {
            console.error('Failed to fetch location data:', error);
            setError(`Failed to load location data: ${error.message}`);
            
            // Use mock data as fallback
            console.log('Using mock data as fallback');
            const mockLocations = getMockLocations();
            const processedMockLocations = processLocations(mockLocations);
            setLocations(processedMockLocations);
            
            // Initialize map
            if (mapRef.current && !mapInstanceRef.current) {
                initMap(processedMockLocations);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Mock data (fallback)
    const getMockLocations = () => {
        return [
            { id: '3110031', name: 'Hong Kong Cultural Centre', latitude: 22.2933, longitude: 114.1699, area: 'North District', eventNum: 3 },
            { id: '3110267', name: 'Hong Kong City Hall', latitude: 22.2933, longitude: 114.1699, area: 'North District', eventNum: 2 },
            { id: '3110565', name: 'Ko Shan Theatre', latitude: 22.3367, longitude: 114.1875, area: 'Tai Po District', eventNum: 1 },
            { id: '35510043', name: 'Kwai Tsing Theatre', latitude: 22.3536, longitude: 114.1011, area: 'Tai Po District', eventNum: 0 },
            { id: '35510044', name: 'Sai Wan Ho Civic Centre', latitude: 22.2822, longitude: 114.2292, area: 'Tai Po District', eventNum: 2 },
            { id: '35511887', name: 'Ngau Chi Wan Civic Centre', latitude: 22.3358, longitude: 114.2092, area: 'Tai Po District', eventNum: 1 },
            { id: '35517396', name: 'Yuen Long Theatre', latitude: 22.4450, longitude: 114.0269, area: 'Tai Po District', eventNum: 0 },
            { id: '35517495', name: 'Tuen Mun Town Hall', latitude: 22.3958, longitude: 113.9731, area: 'Tai Po District', eventNum: 3 },
            { id: '36310304', name: 'Sha Tin Town Hall', latitude: 22.3808, longitude: 114.1869, area: 'Sha Tin District', eventNum: 2 },
            { id: '36310566', name: 'Tai Po Civic Centre', latitude: 22.4481, longitude: 114.1669, area: 'Sha Tin District', eventNum: 1 }
        ];
    };

    // Initialize map
    const initMap = (locationsToMap) => {
        if (mapInstanceRef.current || !mapRef.current) return;
        
        try {
            console.log('Initializing map...');
            
            // Calculate center point
            const centerLat = locationsToMap.reduce((sum, loc) => sum + loc.displayLatitude, 0) / locationsToMap.length;
            const centerLng = locationsToMap.reduce((sum, loc) => sum + loc.displayLongitude, 0) / locationsToMap.length;
            
            mapInstanceRef.current = L.map(mapRef.current).setView(
                locationsToMap.length > 0 ? [centerLat, centerLng] : [22.3193, 114.1694], 
                locationsToMap.length > 0 ? 11 : 12
            );
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(mapInstanceRef.current);
            
            addMarkersToMap();
            console.log('Map initialization complete');
            
        } catch (error) {
            console.error('Map initialization failed:', error);
            setError(`Map initialization failed: ${error.message}`);
        }
    };

    // Add markers to map
    const addMarkersToMap = () => {
        if (!mapInstanceRef.current || locations.length === 0) return;
        
        // Clear existing markers
        markersRef.current.forEach(marker => {
            if (marker && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker);
            }
        });
        markersRef.current = [];
        
        // Create custom icon
        const createCustomIcon = (isSelected = false, eventNum = 0, isOffset = false) => {
            const hasEvents = eventNum > 0;
            const bgColor = isSelected ? '#e74c3c' : hasEvents ? '#2ecc71' : '#3498db';
            
            // Add visual indicator for offset markers
            const offsetIndicator = isOffset ? '<div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; background: #f39c12; border-radius: 50%;"></div>' : '';
            
            return L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        background: ${bgColor};
                        width: ${isSelected ? '40px' : '36px'};
                        height: ${isSelected ? '40px' : '36px'};
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: ${isSelected ? '18px' : '16px'};
                        transition: all 0.3s;
                        position: relative;
                    ">
                        <div style="transform: translateY(-1px)">📍</div>
                        ${hasEvents && eventNum > 0 ? `
                            <div style="
                                position: absolute;
                                top: -5px;
                                right: -5px;
                                background: #e74c3c;
                                color: white;
                                border-radius: 50%;
                                width: 20px;
                                height: 20px;
                                font-size: 11px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border: 2px solid white;
                            ">
                                ${eventNum}
                            </div>
                        ` : ''}
                        ${offsetIndicator}
                    </div>
                `,
                iconSize: isSelected ? [40, 40] : [36, 36],
                iconAnchor: isSelected ? [20, 40] : [18, 36]
            });
        };
        
        // Determine which locations to show
        // If a location is selected, only show that one. Otherwise, show all.
        const locationsToShow = selectedLocation 
            ? locations.filter(location => location.id === selectedLocation)
            : locations;
        
        // Add markers
        locationsToShow.forEach(location => {
            const isSelected = selectedLocation === location.id;
            const marker = L.marker([location.displayLatitude, location.displayLongitude], {
                icon: createCustomIcon(isSelected, location.eventNum || 0, location.isOffset)
            })
                .addTo(mapInstanceRef.current)
                .bindTooltip(`
                    <div style="font-weight: bold; margin-bottom: 5px;">${location.name}</div>
                    <div style="font-size: 12px; color: #666;">Area: ${location.area || 'Unknown'}</div>
                    ${location.eventNum > 0 ? `<div style="font-size: 12px; color: #27ae60;">Events: ${location.eventNum}</div>` : ''}
                    ${location.groupSize > 1 ? `<div style="font-size: 11px; color: #f39c12;">(${location.groupIndex + 1}/${location.groupSize} at this location)</div>` : ''}
                `, {
                    direction: 'top',
                    offset: [0, -18],
                    opacity: 0.9,
                    className: 'map-tooltip'
                });
            
            marker.on('click', () => {
                handleMarkerClick(location.id);
            });
            
            markersRef.current.push(marker);
        });
    };

    // Component mount
    useEffect(() => {
        console.log('MapPage component mounted');
        fetchLocations();
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update map when location data changes
    useEffect(() => {
        if (locations.length > 0 && mapInstanceRef.current) {
            addMarkersToMap();
        }
    }, [locations, selectedLocation]);

    const handleMarkerClick = (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        if (!location) return;
        
        setSelectedLocation(locationId);
        setComments([]); // Clear comments
        setIsCommentsPaneOpen(true);
        
        // Move to selected location (use original coordinates for better centering)
        if (mapInstanceRef.current) {
            const lat = location.originalLatitude || location.latitude;
            const lng = location.originalLongitude || location.longitude;
            mapInstanceRef.current.setView([lat, lng], 20);
        }
        
        // Note: addMarkersToMap will be called automatically due to the useEffect dependency on selectedLocation
        // This will cause only the selected marker to be displayed
    };

    const closeCommentsPane = () => {
        setIsCommentsPaneOpen(false);
        setSelectedLocation(null); // Clear selected location to show all markers again
        
        // Return to overall view
        if (mapInstanceRef.current && locations.length > 0) {
            const centerLat = locations.reduce((sum, loc) => sum + loc.displayLatitude, 0) / locations.length;
            const centerLng = locations.reduce((sum, loc) => sum + loc.displayLongitude, 0) / locations.length;
            mapInstanceRef.current.setView([centerLat, centerLng], 11);
        }
        
        // Note: addMarkersToMap will be called automatically due to the useEffect dependency on selectedLocation
        // This will cause all markers to be displayed again
    };

    const handleAddComment = () => {
        if (!newComment.trim() || !selectedLocation) return;
        
        const newCommentObj = {
            id: Date.now(),
            username: 'User',
            text: newComment.trim(),
            date: new Date().toLocaleDateString('en-US')
        };
        
        setComments(prev => [...prev, newCommentObj]);
        setNewComment('');
    };

    const refreshData = () => {
        fetchLocations();
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            margin: 0,
            padding: 0,
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #2c3e50, #3498db)',
                color: 'white',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
                    Cultural Events Map
                </h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={refreshData}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Refresh
                    </button>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Locations: {locations.length}
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <main style={{ 
                flex: 1, 
                display: 'flex', 
                position: 'relative',
                background: '#f5f5f5'
            }}>
                {/* Map container */}
                <div ref={mapRef} style={{ 
                    flex: 1,
                    background: '#e0e0e0'
                }} />
                
                {/* Loading state */}
                {isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                                Loading...
                            </div>
                            <div style={{ 
                                width: '50px', 
                                height: '50px', 
                                border: '5px solid #f3f3f3',
                                borderTop: '5px solid #3498db',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }} />
                            <style>{`
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `}</style>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && !isLoading && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(231, 76, 60, 0.9)',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        zIndex: 1001,
                        maxWidth: '80%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <strong>⚠️ Data Loading Error</strong>
                            <button
                                onClick={() => setError('')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    </div>
                )}

                {/* Comments panel */}
                {isCommentsPaneOpen && selectedLocation && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '350px',
                        height: '100%',
                        background: 'white',
                        boxShadow: '-2px 0 20px rgba(0,0,0,0.15)',
                        zIndex: 900,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Panel header */}
                        <div style={{
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #2c3e50, #3498db)',
                            color: 'white'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                            }}>
                                <h3 style={{ margin: 0 }}>
                                    {locations.find(l => l.id === selectedLocation)?.name || 'Detail'}
                                </h3>
                                <button
                                    onClick={closeCommentsPane}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        color: 'white',
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                Area: {locations.find(l => l.id === selectedLocation)?.area || 'Unknown'}
                            </div>
                        </div>

                        {/* Comments content */}
                        <div style={{ 
                            flex: 1, 
                            overflowY: 'auto',
                            padding: '1.5rem'
                        }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem' }}>
                                    Comments ({comments.length})
                                </h4>
                                
                                {comments.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        color: '#999',
                                        padding: '2rem 0',
                                        fontStyle: 'italic'
                                    }}>
                                        Be the first!
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {comments.map(comment => (
                                            <div key={comment.id} style={{
                                                padding: '1rem',
                                                background: '#f8f9fa',
                                                borderRadius: '8px',
                                                border: '1px solid #eee'
                                            }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    <strong style={{ fontSize: '0.9rem' }}>
                                                        {comment.username}
                                                    </strong>
                                                    <span style={{ 
                                                        fontSize: '0.8rem', 
                                                        color: '#666' 
                                                    }}>
                                                        {comment.date}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem' }}>
                                                    {comment.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add comment */}
                            <div style={{
                                padding: '1.5rem',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #eaeaea'
                            }}>
                                <h4 style={{ marginBottom: '1rem' }}>Add Comment</h4>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    style={{
                                        width: '90%',
                                        padding: '0.75rem',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        marginBottom: '1rem',
                                        minHeight: '80px',
                                        fontFamily: 'inherit',
                                        fontSize: '0.9rem',
                                        resize: 'vertical'
                                    }}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: newComment.trim() ? '#3498db' : '#bdc3c7',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    POST COMMENT
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MapPage;
