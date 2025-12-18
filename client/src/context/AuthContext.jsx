import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(null);

  // 统一获取 2FA 状态的方法，供页面与 Header 调用
  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch('/2fa/status', {
        credentials: 'include',
      });

      if (!response.ok) {
        setTwoFactorEnabled(false);
        return false;
      }

      const data = await response.json();
      const enabled = !!data.twoFactorEnabled;
      setTwoFactorEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Fetch 2FA status failed:', error);
      setTwoFactorEnabled(false);
      return false;
    }
  };

  useEffect(() => {
    // 检查用户是否已登录
    const checkAuth = async () => {
      try {
        const response = await fetch('/login/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数，接受完整 user 对象
  const login = async (userData) => {
    setUser(userData);
    // 登录后刷新一次 2FA 状态
    try {
      await fetchTwoFactorStatus();
    } catch (e) {
      // 忽略 2FA 状态错误，不影响基本登录
    }
  };

  const logout = async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setTwoFactorEnabled(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        twoFactorEnabled,
        fetchTwoFactorStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};