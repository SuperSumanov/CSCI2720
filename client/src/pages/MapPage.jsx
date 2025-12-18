import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';

const MapPage = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { user, login } = useContext(AuthContext);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isCommentsPaneOpen, setIsCommentsPaneOpen] = useState(false);
    const [favorites, setFavorites] = useState({});
    const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [processedNavigation, setProcessedNavigation] = useState(false);
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);


    const API_BASE_URL = 'http://localhost:3000';

    // 保存收藏状态到sessionStorage（可选，用于临时缓存）
    const saveFavoritesToSessionStorage = (favoritesMap) => {
        try {
            sessionStorage.setItem('mapFavorites', JSON.stringify(favoritesMap));
        } catch (error) {
            console.error('Error saving favorites to sessionStorage:', error);
        }
    };

    // 更新收藏状态
    const updateFavoriteStatus = useCallback((locationId, isFav) => {
        setFavorites(prev => {
            const newFavorites = {
                ...prev,
                [locationId]: isFav
            };
            // 保存到sessionStorage（可选缓存）
            saveFavoritesToSessionStorage(newFavorites);
            return newFavorites;
        });
    }, []);

    // 获取用户的所有收藏 - 每次打开页面时调用
    const fetchUserFavorites = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/favorite/my-all`, {
                credentials: 'include' // 使用session认证
            });
            
            if (response.ok) {
                const favoritesData = await response.json();
                // 转换为 {locationId: true} 的格式
                const favoritesMap = {};
                favoritesData.forEach(fav => {
                    const locationId = fav.locationId || fav.location?.id;
                    if (locationId) {
                        favoritesMap[locationId] = true;
                    }
                });
                return favoritesMap;
            } else if (response.status === 401 || response.status === 403) {
                console.log('User not authenticated for favorites');
                return {};
            }
            return {};
        } catch (error) {
            console.error('Error fetching favorites:', error);
            return {};
        }
    }, []);

    // 每次组件加载时都重新加载收藏
    const loadUserFavorites = async () => {
        setIsCheckingFavorite(true);
        try {
            const favoritesMap = await fetchUserFavorites();
            
            // 使用服务器返回的收藏状态
            setFavorites(favoritesMap);
            saveFavoritesToSessionStorage(favoritesMap);
            console.log(`Loaded ${Object.keys(favoritesMap).length} favorites from server`);
        } catch (error) {
            console.error('Failed to load favorites from server:', error);
            // 尝试从sessionStorage恢复
            try {
                const savedFavorites = sessionStorage.getItem('mapFavorites');
                if (savedFavorites) {
                    setFavorites(JSON.parse(savedFavorites));
                }
            } catch (e) {
                console.log('No cached favorites available');
            }
        } finally {
            setIsCheckingFavorite(false);
        }
    };

    // 检查特定地点是否为收藏
    const isLocationFavorite = (locationId) => {
        return !!favorites[locationId];
    };

    // 收藏地点
    const addToFavorites = async () => {
        if (!selectedLocation) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/favorite/${selectedLocation}`, {
                method: 'GET',
                credentials: 'include' // 使用session认证
            });
            
            if (response.ok || response.status === 409) {
                // 更新本地状态
                updateFavoriteStatus(selectedLocation, true);
                alert('Location added to favorites!');
            } else {
                const errorData = await response.json();
                alert(`Failed to add to favorites: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            alert('Failed to add to favorites. Please try again.');
        }
    };

    // 取消收藏
    const removeFromFavorites = async () => {
        if (!selectedLocation) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/favorite/${selectedLocation}`, {
                method: 'DELETE',
                credentials: 'include' // 使用session认证
            });
            
            if (response.ok) {
                // 更新本地状态
                updateFavoriteStatus(selectedLocation, false);
                alert('Location removed from favorites!');
            } else if (response.status === 404) {
                // 如果后端说没有收藏，也更新本地状态
                updateFavoriteStatus(selectedLocation, false);
                alert('This location was not in your favorites.');
            } else {
                const errorData = await response.json();
                alert(`Failed to remove from favorites: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error removing from favorites:', error);
            alert('Failed to remove from favorites. Please try again.');
        }
    };

    // 切换收藏状态
    const toggleFavorite = () => {
        if (isLocationFavorite(selectedLocation)) {
            removeFromFavorites();
        } else {
            addToFavorites();
        }
    };

    // 从后端获取特定地点的评论
    const fetchLocationComments = async (locationId) => {
        if (!locationId) return;
        
        setIsLoadingComments(true);
        setCommentError('');
        
        try {
            console.log(`Fetching comments for location: ${locationId}`);
            const response = await fetch(`${API_BASE_URL}/comment/loc-all/${locationId}`);
            
            if (response.ok) {
                const commentsData = await response.json();
                console.log(`Got ${commentsData.length} comments for location ${locationId}`);
                
                // 将timestamp转换为可读格式
                const formattedComments = commentsData.map(comment => ({
                    id: comment.commentId,
                    userId: comment.userId,
                    username: comment.username || `User ${comment.userId.substring(0, 6)}`,
                    text: comment.content,
                    date: new Date(comment.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    timestamp: comment.timestamp
                }));
                
                // 按时间排序（最新的在前面）
                formattedComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                setComments(formattedComments);
            } else {
                const errorData = await response.json();
                setCommentError(`Failed to load comments: ${errorData.error || 'Unknown error'}`);
                console.error('Failed to fetch comments:', errorData);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setCommentError(`Failed to load comments: ${error.message}`);
        } finally {
            setIsLoadingComments(false);
        }
    };

    // 提交评论到后端
    const submitComment = async () => {
        if (!newComment.trim() || !selectedLocation) return;
        
        try {
            setCommentError('');
            const response = await fetch(`${API_BASE_URL}/comment/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // 使用session认证
                body: JSON.stringify({
                    locID: selectedLocation,
                    content: newComment.trim()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Comment posted successfully:', result);
                
                // 清空输入框
                setNewComment('');
                
                // 重新加载评论
                await fetchLocationComments(selectedLocation);
                
                alert('Comment posted successfully!');
            } else {
                const errorData = await response.json();
                setCommentError(`Failed to post comment: ${errorData.error || 'Unknown error'}`);
                alert(`Failed to post comment: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            setCommentError(`Failed to post comment: ${error.message}`);
            alert(`Failed to post comment: ${error.message}`);
        }
    };

    // 删除评论（需要用户登录且是自己的评论）
    const deleteComment = async (commentId) => {
        if (!commentId) return;
        
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/comment/del/${commentId}`, {
                method: 'DELETE',
                credentials: 'include' // 使用session认证
            });
            
            if (response.ok) {
                console.log('Comment deleted successfully');
                // 重新加载评论
                await fetchLocationComments(selectedLocation);
                alert('Comment deleted successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to delete comment: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert(`Failed to delete comment: ${error.message}`);
        }
    };

    // 原有的辅助函数保持不变
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

    const calculateOffset = (index, totalAtSameLocation) => {
        if (totalAtSameLocation <= 1) return { latOffset: 0, lngOffset: 0 };
        
        const radius = 0.0005;
        const angle = (2 * Math.PI * index) / totalAtSameLocation;
        
        return {
            latOffset: radius * Math.cos(angle),
            lngOffset: radius * Math.sin(angle)
        };
    };

    const processLocations = (rawLocations) => {
        const locationGroups = {};
        const processedLocations = [];
        
        rawLocations.forEach(location => {
            const key = `${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}`;
            if (!locationGroups[key]) {
                locationGroups[key] = [];
            }
            locationGroups[key].push(location);
        });
        
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

    const fetchLocations = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            console.log('Fetching location data...');
            
            const isConnected = await testBackendConnection();
            if (!isConnected) {
                throw new Error('Cannot connect to backend server');
            }
            
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
                locationsData = getMockLocations();
            }
            
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
            
            const processedLocations = processLocations(validLocations);
            setLocations(processedLocations);
            
            if (processedLocations.length > 0 && mapRef.current && !mapInstanceRef.current) {
                initMap(processedLocations);
            }
            
        } catch (error) {
            console.error('Failed to fetch location data:', error);
            setError(`Failed to load location data: ${error.message}`);
            
            console.log('Using mock data as fallback');
            const mockLocations = getMockLocations();
            const processedMockLocations = processLocations(mockLocations);
            setLocations(processedMockLocations);
            
            if (mapRef.current && !mapInstanceRef.current) {
                initMap(processedMockLocations);
            }
        } finally {
            setIsLoading(false);
        }
    };

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

    const initMap = (locationsToMap) => {
        if (mapInstanceRef.current || !mapRef.current) return;
        
        try {
            console.log('Initializing map...');
            
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

    const addMarkersToMap = () => {
        if (!mapInstanceRef.current || locations.length === 0) return;
        
        markersRef.current.forEach(marker => {
            if (marker && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker);
            }
        });
        markersRef.current = [];
        
        const createCustomIcon = (isSelected = false, eventNum = 0, isOffset = false) => {
            const hasEvents = eventNum > 0;
            const bgColor = isSelected ? '#e74c3c' : hasEvents ? '#2ecc71' : '#3498db';
            
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
        
        const locationsToShow = selectedLocation 
            ? locations.filter(location => location.id === selectedLocation)
            : locations;
        
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

    // 处理从LocationsPage导航过来的逻辑
    useEffect(() => {
        if (!processedNavigation && location.state && location.state.selectedLocationId && locations.length > 0) {
            const locationId = location.state.selectedLocationId;
            console.log('Processing navigation from LocationsPage, locationId:', locationId);
            
            const foundLocation = locations.find(loc => loc.id === locationId);
            if (foundLocation) {
                console.log('Found location, opening sidebar...');
                setSelectedLocation(locationId);
                setIsCommentsPaneOpen(true);
                
                // 加载评论和收藏
                fetchLocationComments(locationId);
                loadUserFavorites();
                
                // 移动地图到该位置
                if (mapInstanceRef.current) {
                    const lat = foundLocation.originalLatitude || foundLocation.latitude;
                    const lng = foundLocation.originalLongitude || foundLocation.longitude;
                    mapInstanceRef.current.setView([lat, lng], 20);
                }
                
                // 标记导航已处理
                setProcessedNavigation(true);
                
                // 清除导航状态，避免重复执行
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, locations, processedNavigation]);

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

    // 监听用户登录状态变化
    useEffect(() => {
        // 如果用户未登录，重定向到登录页面
        if (!user) {
            console.log('User not authenticated, redirecting to login...');
            navigate('/');
        }
    }, [user, navigate]);

    // Update map when location data changes
    useEffect(() => {
        if (locations.length > 0 && mapInstanceRef.current) {
            addMarkersToMap();
        }
    }, [locations, selectedLocation]);

    const handleMarkerClick = async (locationId) => {
        const location = locations.find(loc => loc.id === locationId);
        if (!location) return;
        
        setSelectedLocation(locationId);
        setIsCommentsPaneOpen(true);
        
        // 从后端加载评论
        await fetchLocationComments(locationId);
        
        // 每次点击标记时都重新加载收藏状态
        await loadUserFavorites();
        
        // Move to selected location
        if (mapInstanceRef.current) {
            const lat = location.originalLatitude || location.latitude;
            const lng = location.originalLongitude || location.longitude;
            mapInstanceRef.current.setView([lat, lng], 20);
        }
    };

    const closeCommentsPane = () => {
        setIsCommentsPaneOpen(false);
        setSelectedLocation(null);
        setComments([]);
        setNewComment('');
        setCommentError('');
        
        // 重置导航处理标志
        setProcessedNavigation(false);
        
        // Return to overall view
        if (mapInstanceRef.current && locations.length > 0) {
            const centerLat = locations.reduce((sum, loc) => sum + loc.displayLatitude, 0) / locations.length;
            const centerLng = locations.reduce((sum, loc) => sum + loc.displayLongitude, 0) / locations.length;
            mapInstanceRef.current.setView([centerLat, centerLng], 11);
        }
    };

    const refreshData = () => {
        fetchLocations();
        // 刷新时也重新加载收藏
        if (selectedLocation) {
            loadUserFavorites();
        }
    };

    // 如果用户未登录，显示重定向提示
    if (!user) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #2c3e50, #3498db)',
                color: 'white'
            }}>
                <h1>Authentication Required</h1>
                <p>Please login to access the map.</p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        marginTop: '1rem'
                    }}
                >
                    Go to Login
                </button>
            </div>
        );
    }

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
                    {/* 显示当前用户 */}
                    <div style={{ 
                        fontSize: '0.9rem', 
                        background: 'rgba(255,255,255,0.2)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px'
                    }}>
                        Welcome, {user.username}
                    </div>
                    
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0 }}>
                                        Comments ({comments.length})
                                    </h4>
                                    <button
                                        onClick={() => {
                                            fetchLocationComments(selectedLocation);
                                            loadUserFavorites(); // 刷新时重新加载收藏
                                        }}
                                        style={{
                                            background: '#f8f9fa',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Refresh
                                    </button>
                                </div>
                                
                                {/* Comment error */}
                                {commentError && (
                                    <div style={{
                                        background: '#ffebee',
                                        color: '#c62828',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        marginBottom: '1rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        {commentError}
                                    </div>
                                )}
                                
                                {/* Comments loading */}
                                {isLoadingComments ? (
                                    <div style={{
                                        textAlign: 'center',
                                        color: '#999',
                                        padding: '2rem 0',
                                        fontStyle: 'italic'
                                    }}>
                                        Loading comments...
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        color: '#999',
                                        padding: '2rem 0',
                                        fontStyle: 'italic'
                                    }}>
                                        No comments yet. Be the first!
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {comments.map(comment => (
                                            <div key={comment.id} style={{
                                                padding: '1rem',
                                                background: '#f8f9fa',
                                                borderRadius: '8px',
                                                border: '1px solid #eee',
                                                position: 'relative'
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
                                                {/* Delete button */}
                                                {(
                                                    <button
                                                        onClick={() => deleteComment(comment.id)}
                                                        style={{
                                                            position: 'absolute',
                                                            top: '0.5rem',
                                                            right: '0.5rem',
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#e74c3c',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            opacity: 0.7
                                                        }}
                                                        title="Delete comment"
                                                    >
                                                        ×
                                                    </button>
                                                )}
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
                                    onClick={submitComment}
                                    disabled={!newComment.trim()}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: newComment.trim() && !isLoadingComments ? '#3498db' : '#bdc3c7',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: newComment.trim() && !isLoadingComments ? 'pointer' : 'not-allowed',
                                        fontSize: '0.9rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isLoadingComments ? 'POSTING...' : 'POST COMMENT'}
                                </button>
                                
                                {/* Favorite button */}
                                {
                                isCheckingFavorite ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '0.75rem',
                                        background: '#f8f9fa',
                                        borderRadius: '6px',
                                        marginTop: '1rem',
                                        color: '#666'
                                    }}>
                                        Loading favorite status...
                                    </div>
                                ) : (
                                    <button
                                        onClick={toggleFavorite}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: isLocationFavorite(selectedLocation) ? '#e74c3c' : '#2ecc71',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            marginTop: '1rem'
                                        }}
                                    >
                                        {isLocationFavorite(selectedLocation) ? 'REMOVE FROM FAVORITE' : 'ADD TO FAVORITE'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MapPage;
