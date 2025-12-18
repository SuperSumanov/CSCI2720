import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationName, setLocationName] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isCommentsPaneOpen, setIsCommentsPaneOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const paneRef = useRef(null);

    // 模拟位置数据（在实际应用中应该从API获取）
    const mockLocations = [
        { id: '3110031', name: 'Hong Kong Cultural Centre', latitude: 22.2933, longitude: 114.1699 },
        { id: '3110267', name: 'Hong Kong City Hall', latitude: 22.2819, longitude: 114.1586 },
        { id: '3110565', name: 'Ko Shan Theatre', latitude: 22.3367, longitude: 114.1875 },
        { id: '35510043', name: 'Kwai Tsing Theatre', latitude: 22.3536, longitude: 114.1011 },
        { id: '35510044', name: 'Sai Wan Ho Civic Centre', latitude: 22.2822, longitude: 114.2292 },
        { id: '35511887', name: 'Ngau Chi Wan Civic Centre', latitude: 22.3358, longitude: 114.2092 },
        { id: '35517396', name: 'Yuen Long Theatre', latitude: 22.4450, longitude: 114.0269 },
        { id: '35517495', name: 'Tuen Mun Town Hall', latitude: 22.3958, longitude: 113.9731 },
        { id: '36310304', name: 'Sha Tin Town Hall', latitude: 22.3808, longitude: 114.1869 },
        { id: '36310566', name: 'Tai Po Civic Centre', latitude: 22.4481, longitude: 114.1669 }
    ];

    // API基础URL - 在实际项目中，这个应该从环境变量中获取
    const API_BASE_URL = 'http://localhost:3000';

    // 样式定义
    const styles = {
        app: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            fontFamily: "'Arial', sans-serif",
            lineHeight: 1.6,
            color: '#333',
            position: 'relative'
        },
        
        header: {
            background: 'linear-gradient(135deg, #2c3e50, #3498db)',
            color: 'white',
            padding: '1rem 2rem',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        
        headerTitle: {
            fontSize: '1.5rem',
            margin: 0
        },
        
        main: {
            flex: 1,
            display: 'flex',
            position: 'relative',
            overflow: 'hidden'
        },
        
        mapContainer: {
            flex: 1,
            position: 'relative',
            zIndex: 1
        },
        
        mainMap: {
            width: '100%',
            height: '100%'
        },
        
        // 评论弹窗样式
        commentsPane: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '350px',
            height: '100%',
            background: 'white',
            boxShadow: '2px 0 20px rgba(0, 0, 0, 0.15)',
            zIndex: 100,
            transform: isCommentsPaneOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        
        paneHeader: {
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #2c3e50, #3498db)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
        },
        
        paneTitle: {
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '500'
        },
        
        locationName: {
            fontSize: '0.9rem',
            opacity: 0.9,
            marginTop: '0.25rem'
        },
        
        closeButton: {
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.3s',
            fontSize: '1.2rem',
            flexShrink: 0
        },
        
        paneContent: {
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
        },
        
        // 评论部分
        commentsSection: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        },
        
        commentsCount: {
            color: '#2c3e50',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '2px solid #eee',
            fontSize: '0.9rem',
            fontWeight: '500'
        },
        
        commentsList: {
            flex: 1,
            overflowY: 'auto',
            marginBottom: '1.5rem'
        },
        
        commentItem: {
            padding: '1rem',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
            borderRadius: '8px',
            marginBottom: '0.75rem'
        },
        
        commentHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
        },
        
        commentAuthor: {
            fontWeight: 'bold',
            color: '#2c3e50',
            fontSize: '0.9rem'
        },
        
        commentDate: {
            color: '#888',
            fontSize: '0.8rem'
        },
        
        commentText: {
            color: '#555',
            lineHeight: 1.5,
            fontSize: '0.9rem'
        },
        
        noComments: {
            color: '#999',
            textAlign: 'center',
            padding: '3rem 1rem',
            fontStyle: 'italic',
            fontSize: '0.9rem'
        },
        
        // 添加评论表单
        addCommentSection: {
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #eaeaea',
            flexShrink: 0
        },
        
        commentFormTitle: {
            color: '#2c3e50',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            fontWeight: '500'
        },
        
        commentTextarea: {
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            resize: 'vertical',
            marginBottom: '1rem',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            minHeight: '80px',
            transition: 'border-color 0.3s',
            boxSizing: 'border-box'
        },
        
        submitButton: {
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'background 0.3s',
            width: '100%',
            fontWeight: '500'
        },
        
        submitButtonHover: {
            background: '#2980b9'
        },
        
        submitButtonDisabled: {
            background: '#bdc3c7',
            cursor: 'not-allowed'
        },
        
        errorMessage: {
            color: '#e74c3c',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            padding: '0.5rem',
            background: '#fdf2f2',
            borderRadius: '4px',
            border: '1px solid #f8d7da'
        },
        
        loadingIndicator: {
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
            fontSize: '0.9rem'
        },
        
        // 叠加层
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 50,
            opacity: isCommentsPaneOpen ? 1 : 0,
            visibility: isCommentsPaneOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.3s, visibility 0.3s',
            cursor: 'pointer'
        },
        
        // 响应式
        '@media (max-width: 768px)': {
            commentsPane: {
                width: '100%',
                maxWidth: '100%'
            }
        }
    };

    // 初始化地图
    useEffect(() => {
        const initMap = () => {
            if (!mapInstanceRef.current && mapRef.current) {
                mapInstanceRef.current = L.map(mapRef.current).setView([22.3193, 114.1694], 12);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(mapInstanceRef.current);
                
                addMarkersToMap(mockLocations);
            }
        };

        initMap();

        // 处理浏览器历史
        const handlePopState = () => {
            const url = new URL(window.location.href);
            const locationId = url.searchParams.get('location');
            
            if (locationId) {
                handleMarkerClick(locationId, false);
            } else {
                closeCommentsPane();
            }
        };

        window.addEventListener('popstate', handlePopState);
        
        // 初始URL处理
        const url = new URL(window.location.href);
        const initialLocationId = url.searchParams.get('location');
        if (initialLocationId) {
            handleMarkerClick(initialLocationId, false);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // 添加标记到地图
    const addMarkersToMap = (locationsData) => {
        if (!mapInstanceRef.current) return;

        // 清除现有标记
        markersRef.current.forEach(marker => {
            if (marker && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker);
            }
        });
        markersRef.current = [];

        // 创建自定义图标
        const createCustomIcon = (isSelected = false) => {
            return L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        background: ${isSelected ? '#e74c3c' : '#3498db'};
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.3s;
                    ">
                        <div style="transform: translateY(-1px)">📍</div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 36]
            });
        };

        // 添加新标记
        locationsData.forEach(location => {
            const isSelected = selectedLocation === location.id;
            const marker = L.marker([location.latitude, location.longitude], {
                icon: createCustomIcon(isSelected)
            })
                .addTo(mapInstanceRef.current)
                .bindTooltip(location.name, {
                    direction: 'top',
                    offset: [0, -18],
                    opacity: 0.9,
                    className: 'map-tooltip'
                });
            
            // 标记点击事件
            marker.on('click', () => {
                handleMarkerClick(location.id, true);
            });

            markersRef.current.push(marker);
        });
    };

    // 从后端API获取评论
    const fetchComments = async (locationId) => {
        setIsLoading(true);
        setError('');
        
        try {
            // 调用后端API获取某个地点的所有评论
            const response = await fetch(`${API_BASE_URL}/comment/loc-all/${locationId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
            }
            
            const commentsData = await response.json();
            
            // 将后端数据转换为前端需要的格式
            const formattedComments = commentsData.map(comment => ({
                id: comment.commentId || comment._id,
                locationId: comment.locationId,
                username: comment.username || 'Anonymous', // 根据后端返回的实际字段调整
                text: comment.content,
                date: new Date(comment.timestamp).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }),
                timestamp: comment.timestamp,
                userId: comment.userId
            }));
            
            return formattedComments;
        } catch (error) {
            console.error('Error fetching comments:', error);
            setError(`Failed to load comments: ${error.message}`);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // 向后端API提交评论
    const submitComment = async (commentData) => {
        setIsLoading(true);
        setError('');
        
        try {
            // 获取认证token（假设存储在localStorage中）
            const token = localStorage.getItem('authToken');
            
            const response = await fetch(`${API_BASE_URL}/comment/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    locID: commentData.locationId,
                    content: commentData.text
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to submit comment: ${response.status}`);
            }
            
            const result = await response.json();
            
            // 返回新创建的评论
            return {
                id: result.comment._id || Date.now(),
                locationId: commentData.locationId,
                username: commentData.username,
                text: commentData.text,
                date: new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error submitting comment:', error);
            setError(`Failed to submit comment: ${error.message}`);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 处理标记点击
    const handleMarkerClick = async (locationId, pushHistory = true) => {
        // 找到位置信息
        const location = mockLocations.find(loc => loc.id === locationId);
        if (!location) return;
        
        // 更新选中的位置
        setSelectedLocation(locationId);
        setLocationName(location.name);
        
        // 从API加载评论
        const locationComments = await fetchComments(locationId);
        setComments(locationComments);
        
        // 打开评论弹窗
        setIsCommentsPaneOpen(true);
        
        // 更新URL并推入历史记录（如果需要）
        if (pushHistory) {
            const url = new URL(window.location.href);
            url.searchParams.set('location', locationId);
            window.history.pushState({ locationId }, '', url);
        }
        
        // 重新渲染标记以更新选中状态
        addMarkersToMap(mockLocations);
        
        // 居中显示选中的标记
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([location.latitude, location.longitude], 14);
        }
    };

    // 关闭评论弹窗
    const closeCommentsPane = () => {
        setIsCommentsPaneOpen(false);
        setSelectedLocation(null);
        setLocationName('');
        setComments([]);
        setNewComment('');
        setError('');
        
        // 更新URL
        const url = new URL(window.location.href);
        url.searchParams.delete('location');
        window.history.pushState({}, '', url);
        
        // 重新渲染标记以清除选中状态
        addMarkersToMap(mockLocations);
        
        // 重置地图视图
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([22.3193, 114.1694], 12);
        }
    };

    // 添加评论
    const handleAddComment = async () => {
        if (newComment.trim() === '' || !selectedLocation) return;
        
        try {
            // 模拟当前用户（在实际应用中应该从登录状态获取）
            const currentUser = localStorage.getItem('currentUser') || 'Current User';
            
            const commentData = {
                locationId: selectedLocation,
                username: currentUser,
                text: newComment.trim()
            };
            
            // 提交评论到后端API
            const newCommentObj = await submitComment(commentData);
            
            // 更新评论列表
            setComments(prevComments => [...prevComments, newCommentObj]);
            setNewComment('');
            
        } catch (error) {
            console.error('Failed to add comment:', error);
            // 错误信息已经在submitComment函数中设置了
        }
    };

    // 处理键盘事件
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isCommentsPaneOpen) {
                closeCommentsPane();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommentsPaneOpen]);

    return (
        <div style={styles.app}>
            <header style={styles.header}>
                <h1 style={styles.headerTitle}>Cultural Events Hong Kong</h1>
            </header>
            
            <main style={styles.main}>
                {/* 地图容器 */}
                <div style={styles.mapContainer}>
                    <div ref={mapRef} style={styles.mainMap} />
                </div>
                
                {/* 评论弹窗 */}
                <div 
                    ref={paneRef}
                    style={styles.commentsPane}
                >
                    <div style={styles.paneHeader}>
                        <div>
                            <h2 style={styles.paneTitle}>{locationName}</h2>
                            {locationName && (
                                <div style={styles.locationName}>
                                    Comments
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={closeCommentsPane}
                            style={styles.closeButton}
                            aria-label="Close comments pane"
                        >
                            ×
                        </button>
                    </div>
                    
                    <div style={styles.paneContent}>
                        <div style={styles.commentsSection}>
                            <div style={styles.commentsCount}>
                                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                            </div>
                            
                            {error && (
                                <div style={styles.errorMessage}>
                                    {error}
                                </div>
                            )}
                            
                            <div style={styles.commentsList}>
                                {isLoading ? (
                                    <div style={styles.loadingIndicator}>
                                        Loading comments...
                                    </div>
                                ) : comments.length > 0 ? (
                                    comments.map((comment) => (
                                        <div key={comment.id} style={styles.commentItem}>
                                            <div style={styles.commentHeader}>
                                                <span style={styles.commentAuthor}>
                                                    {comment.username}
                                                </span>
                                                <span style={styles.commentDate}>
                                                    {comment.date}
                                                </span>
                                            </div>
                                            <div style={styles.commentText}>
                                                {comment.text}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={styles.noComments}>
                                        No comments yet for this location.
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                            Be the first to share your experience!
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div style={styles.addCommentSection}>
                                <div style={styles.commentFormTitle}>
                                    Add a Comment
                                </div>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Share your thoughts about this venue..."
                                    style={styles.commentTextarea}
                                    rows="3"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleAddComment}
                                    style={{
                                        ...styles.submitButton,
                                        ...(newComment.trim() === '' || isLoading ? styles.submitButtonDisabled : {})
                                    }}
                                    disabled={newComment.trim() === '' || isLoading}
                                >
                                    {isLoading ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* 叠加层（点击关闭弹窗） */}
                {isCommentsPaneOpen && (
                    <div 
                        style={styles.overlay}
                        onClick={closeCommentsPane}
                    />
                )}
            </main>
            
            <footer style={{
                background: '#2c3e50',
                color: 'white',
                textAlign: 'center',
                padding: '1rem',
                fontSize: '0.9rem'
            }}>
                <p>© 2024 Cultural Events Web Application | Click on any marker to view and post comments</p>
            </footer>
        </div>
    );
};

export default MapPage;