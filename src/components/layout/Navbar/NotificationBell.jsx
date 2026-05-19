import { BellOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="navbar_notification_wrap">
      <button
        ref={btnRef}
        type="button"
        className={`navbar_notification_btn${open ? ' navbar_notification_btn--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Thông báo"
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <BellOutlined />
        {unreadCount > 0 && (
          <span className="navbar_notification_badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          anchorRef={btnRef}
          notifications={notifications}
          loading={loading}
          onClose={() => setOpen(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </div>
  );
}
