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
const DEFAULT_PAGE_SIZE = 20;
const MAX_STORED_NOTIFICATIONS = 30;
const SHOULD_ENABLE_SIGNALR = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const MAX_SIGNALR_START_RETRIES = 1;
const SILENT_SIGNALR_LOGGER = {
  log: () => {},
};

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

function mergeNotifications(apiList, storedList) {
  const storedMap = new Map(storedList.map((item) => [item.id, item]));
  const mergedApiItems = apiList.map((item) => {
    const existing = storedMap.get(item.id);
    return existing
      ? { ...item, isRead: existing.isRead, is_read: existing.is_read }
      : item;
  });

  const readOnlyStoredItems = storedList.filter(
    (item) => !apiList.some((apiItem) => apiItem.id === item.id) && item.isRead
  );

  return [...mergedApiItems, ...readOnlyStoredItems].slice(0, MAX_STORED_NOTIFICATIONS);
}

export function useNotifications(initialPageSize = DEFAULT_PAGE_SIZE) {
  const initialNotifications = useRef(loadFromStorage());
  const [notifications, setNotifications] = useState(initialNotifications.current);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => countUnread(initialNotifications.current));
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(initialNotifications.current.length);
  const connectionRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const hasFetchedRef = useRef(false);
  const MAX_RECONNECT_DELAY = 30000;
  const connectSignalRRef = useRef(null);
  const scheduleReconnectRef = useRef(null);

  const fetchNotifications = useCallback(async (page = 1, size = pageSize) => {
    if (!jwt.getAccessToken()) {
      return;
    }

    setLoading(true);
    try {
      const response = await https.get('Notification/GetAll', { pageNumber: page, pageSize: size });
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
        const merged = mergeNotifications(apiList, stored);

        saveToStorage(merged);
        setNotifications(merged);
        setUnreadCount(countUnread(merged));
        setTotalCount(total);
        setPageNumber(page);
        hasFetchedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const addNotification = useCallback((normalized) => {
    setNotifications((prev) => {
      if (!normalized?.id || String(normalized.id).trim() === '') {
        normalized = { ...normalized, id: `rt_${Date.now()}_${Math.random().toString(36).slice(2)}` };
      }
      const existing = prev.find((n) => n.id === normalized.id);
      if (existing) return prev;
      const next = [normalized, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
      saveToStorage(next);
      setUnreadCount(countUnread(next));
      setTotalCount((currentTotal) => currentTotal + 1);
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
    if (!SHOULD_ENABLE_SIGNALR) {
      setRealtimeConnected(false);
      return;
    }

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
        .catch(() => {
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
      startConnection(connectionRef.current);
      return;
    }

    const hubUrl = `${hubBaseUrl}/notificationHub`;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => jwt.getAccessToken() || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
      .configureLogging(SILENT_SIGNALR_LOGGER)
      .build();

    conn.onreconnecting(() => {
      setRealtimeConnected(false);
    });

    conn.onreconnected(() => {
      setRealtimeConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    conn.onclose(() => {
      setRealtimeConnected(false);
      scheduleReconnectRef.current?.();
    });

    ['NewCustomerRegistered', 'AccountApproved'].forEach((name) => {
      conn.on(name, (payload) => {
        pushNotification(payload, name);
      });
    });

    connectionRef.current = conn;
    startConnection(conn);
  }, [pushNotification]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current || reconnectAttemptsRef.current >= MAX_SIGNALR_START_RETRIES) {
      return;
    }

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
    if (!jwt.getAccessToken() || hasFetchedRef.current) {
      return;
    }

    fetchNotifications(1, pageSize);
  }, [fetchNotifications, pageSize]);

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
    fetchNotifications(page, pageSize);
  }, [fetchNotifications, pageSize]);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
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
