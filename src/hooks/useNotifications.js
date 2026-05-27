import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import https from '../utils/https';
import jwt from '../utils/jwt';
import { getHubBaseUrl } from '../utils/constants';
import {
  isNotificationUnread,
  normalizeNotification,
} from '../utils/notificationUtils';

const STORAGE_KEY = 'tapmed_notifications';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function countUnread(list) {
  return list.filter(isNotificationUnread).length;
}

const DEFAULT_PAGE_SIZE = 20;

export function useNotifications(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [notifications, setNotifications] = useState(() => loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => countUnread(loadFromStorage()));
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const connectionRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_DELAY = 30000;
  const connectSignalRRef = useRef(null);
  const scheduleReconnectRef = useRef(null);

  const fetchNotifications = useCallback(async (page = pageNumber, size = pageSize) => {
    if (!jwt.getAccessToken()) {
      return;
    }

    setLoading(true);
    try {
      const response = await https.get('Notification/GetAll', {
        params: { pageNumber: page, pageSize: size }
      });
      const data = response?.data;

      if (response?.status === 200 && data?.isSucceeded) {
        const rawList = data?.data?.items || [];
        const total = data?.data?.totalCount || 0;

        const apiList = rawList
          .filter((item) => item.status === 'Chờ duyệt' && item.nameCoSo)
          .map((item) => {
            const displayId = item.userName || item.nameCoSo || `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            return {
              id: displayId,
              type: 'NewCustomerRegistered',
              title: 'Khách hàng mới chờ duyệt',
              message: item.nameCoSo,
              data: {
                fullName: item.fullName || item.userName || item.nameCoSo || '',
                userName: item.userName || '',
                nameCoSo: item.nameCoSo,
                PhoneNumber: item.phoneName || '',
                status: item.status,
              },
              isRead: false,
              is_read: false,
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
              created_at: item.createdAt || item.created_at || new Date().toISOString(),
            };
          });

        const stored = loadFromStorage();
        const storedIds = new Set(stored.map((n) => n.id));

        const merged = [
          ...apiList.map((n) => {
            const existing = stored.find((s) => s.id === n.id);
            return existing ? { ...n, isRead: existing.isRead, is_read: existing.is_read } : n;
          }),
          ...stored.filter((s) => !storedIds.has(s.id) && s.isRead),
        ].slice(0, 30);

        saveToStorage(merged);
        setNotifications(merged);
        setUnreadCount(countUnread(merged));
        setTotalCount(total);
      }
    } catch (error) {
      console.error('Lỗi lấy thông báo:', error);
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize]);

  const addNotification = useCallback((normalized) => {
    setNotifications((prev) => {
      if (!normalized?.id || String(normalized.id).trim() === '') {
        normalized = { ...normalized, id: `rt_${Date.now()}_${Math.random().toString(36).slice(2)}` };
      }
      const existing = prev.find((n) => n.id === normalized.id);
      if (existing) return prev;
      const next = [normalized, ...prev].slice(0, 30);
      saveToStorage(next);
      setUnreadCount(countUnread(next));
      setTotalCount((prev) => prev + 1);
      return next;
    });
  }, []);

  const pushNotification = useCallback((raw, eventType) => {
    const normalized = normalizeNotification(raw, eventType);
    if (!normalized) {
      return;
    }
    addNotification(normalized);
  }, [addNotification]);

  const connectSignalR = useCallback(() => {
    const hubBaseUrl = getHubBaseUrl();
    const token = jwt.getAccessToken();

    if (!hubBaseUrl || !token) return;

    const startConnection = (conn) => {
      conn.start()
        .then(() => conn.invoke('JoinAdminGroup'))
        .then(() => {
          setRealtimeConnected(true);
          reconnectAttemptsRef.current = 0;
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
        })
        .catch((err) => {
          console.error('SignalR start/join error:', err);
          setRealtimeConnected(false);
          scheduleReconnectRef.current?.();
        });
    };

    if (connectionRef.current) {
      const state = connectionRef.current.state;
      if (
        state === signalR.HubConnectionState.Connected ||
        state === signalR.HubConnectionState.Connecting ||
        state === signalR.HubConnectionState.Reconnecting
      ) {
        return;
      }
      // Re-use existing connection
      startConnection(connectionRef.current);
      return;
    }

    const hubUrl = `${hubBaseUrl}/notificationHub`;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => jwt.getAccessToken() || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.onreconnecting(() => {
      setRealtimeConnected(false);
    });

    conn.onreconnected(() => {
      setRealtimeConnected(true);
      reconnectAttemptsRef.current = 0;
      fetchNotifications();
    });

    conn.onclose(() => {
      setRealtimeConnected(false);
      scheduleReconnectRef.current?.();
    });

    const eventNames = [
      'NewCustomerRegistered',
      'AccountApproved',
    ];

    eventNames.forEach((name) => {
      conn.on(name, (payload) => {
        pushNotification(payload, name);
      });
    });

    connectionRef.current = conn;
    startConnection(conn);
  }, [pushNotification, fetchNotifications]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    const attempt = reconnectAttemptsRef.current;
    const delay = Math.min(1000 * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
    reconnectAttemptsRef.current = attempt + 1;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectSignalRRef.current?.();
    }, delay);
  }, []);

  connectSignalRRef.current = connectSignalR;
  scheduleReconnectRef.current = scheduleReconnect;

  useEffect(() => {
    if (jwt.getAccessToken()) {
      fetchNotifications();
    }
  }, []);

  useEffect(() => {
    connectSignalR();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [connectSignalR]);

  const goToPage = useCallback((page) => {
    setPageNumber(page);
    fetchNotifications(page, pageSize);
  }, [fetchNotifications, pageSize]);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setPageNumber(1);
    fetchNotifications(1, size);
  }, [fetchNotifications]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, isRead: true, is_read: true } : n
      );
      saveToStorage(next);
      setUnreadCount(countUnread(next));
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true, is_read: true }));
      saveToStorage(next);
      setUnreadCount(0);
      return next;
    });
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    notifications,
    loading,
    unreadCount,
    realtimeConnected,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    goToPage,
    changePageSize,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
