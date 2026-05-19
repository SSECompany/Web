import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getCustomerInfo,
  getNotificationCreatedAt,
  isNotificationUnread,
} from '../../../utils/notificationUtils';

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(diff)) return '';
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function NotificationIcon({ type }) {
  if (type === 'NewCustomerRegistered') {
    return (
      <span className="navbar_notification_panel_item_icon navbar_notification_panel_item_icon--user">
        <UserOutlined />
      </span>
    );
  }
  return (
    <span className="navbar_notification_panel_item_icon">
      <BellOutlined />
    </span>
  );
}

export default function NotificationPanel({
  anchorRef,
  notifications,
  loading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  const panelRef = useRef(null);
  const [position, setPosition] = useState(null);
  const unreadCount = notifications.filter(isNotificationUnread).length;

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorRef?.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    function handleClickOutside(e) {
      const anchor = anchorRef?.current;
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        anchor &&
        !anchor.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorRef, onClose]);

  if (!position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="navbar_notification_panel"
      style={{ top: position.top, right: position.right }}
      role="dialog"
      aria-label="Thông báo"
    >
      <div className="navbar_notification_panel_header">
        <div className="navbar_notification_panel_header_title">
          <BellOutlined />
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <span className="navbar_notification_panel_header_badge">{unreadCount}</span>
          )}
        </div>
        <div className="navbar_notification_panel_header_actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="navbar_notification_panel_mark_all"
              onClick={onMarkAllAsRead}
            >
              <CheckOutlined />
              Đọc tất cả
            </button>
          )}
          <button
            type="button"
            className="navbar_notification_panel_close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      <div className="navbar_notification_panel_body">
        {loading ? (
          <div className="navbar_notification_panel_loading">
            <span className="navbar_notification_panel_spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="navbar_notification_panel_empty">
            <BellOutlined className="navbar_notification_panel_empty_icon" />
            <span>Chưa có thông báo nào</span>
          </div>
        ) : (
          notifications.map((n) => {
            const customer = getCustomerInfo(n);
            const unread = isNotificationUnread(n);

            return (
              <button
                key={n.id}
                type="button"
                className={`navbar_notification_panel_item${unread ? ' navbar_notification_panel_item--unread' : ''}`}
                onClick={() => unread && onMarkAsRead(n.id)}
              >
                <NotificationIcon type={n.type} />
                <div className="navbar_notification_panel_item_content">
                  <div className="navbar_notification_panel_item_row">
                    <p className="navbar_notification_panel_item_title">{n.title}</p>
                    {unread && <span className="navbar_notification_panel_item_dot" />}
                  </div>
                  {n.message && (
                    <p className="navbar_notification_panel_item_message">{n.message}</p>
                  )}
                  {n.type === 'NewCustomerRegistered' &&
                    (customer.nameCoSo || customer.fullName || customer.phoneNumber) && (
                      <div className="navbar_notification_panel_item_meta">
                        {customer.nameCoSo && (
                          <span>
                            Cơ sở: <strong>{customer.nameCoSo}</strong>
                          </span>
                        )}
                        {customer.fullName && (
                          <span>
                            KH: <strong>{customer.fullName}</strong>
                          </span>
                        )}
                        {customer.phoneNumber && (
                          <span>
                            SDT: <strong>{customer.phoneNumber}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  <p className="navbar_notification_panel_item_time">
                    {relativeTime(getNotificationCreatedAt(n))}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );
}
