export function normalizeNotification(raw, defaultType = 'NewCustomerRegistered') {
  if (!raw || typeof raw !== 'object') return null;

  const payload = raw.data && typeof raw.data === 'object' ? raw.data : raw;
  const fullName =
    payload.fullName ?? payload.FullName ?? raw.fullName ?? raw.FullName;
  const phoneNumber =
    payload.phoneNumber ?? payload.PhoneNumber ?? raw.phoneNumber ?? raw.PhoneNumber;
  const type = raw.type ?? defaultType;
  const isRead = raw.isRead ?? raw.is_read ?? false;
  const createdAt = raw.createdAt ?? raw.created_at ?? new Date().toISOString();

  return {
    id: raw.id ?? raw.Id ?? `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    title:
      raw.title ?? phoneNumber,
    message:
      raw.message ??
      (fullName
        ? `Khách hàng ${fullName}${phoneNumber ? ` - ${phoneNumber}` : ''} vừa đăng ký`
        : ''),
    data: { ...payload, FullName: fullName, PhoneNumber: phoneNumber },
    isRead,
    is_read: isRead,
    createdAt,
    created_at: createdAt,
  };
}

export function isNotificationUnread(n) {
  if (!n) return false;
  if (n.isRead === true || n.is_read === true) return false;
  if (n.isRead === false || n.is_read === false) return true;
  return false;
}

export function getNotificationCreatedAt(n) {
  return n?.created_at || n?.createdAt || '';
}

export function getCustomerInfo(n) {
  const data = n?.data || n || {};
  return {
    fullName: data.FullName ?? data.fullName ?? n?.fullName ?? n?.FullName ?? data.nameCoSo ?? '',
    phoneNumber: data.PhoneNumber ?? data.phoneNumber ?? n?.phoneNumber ?? n?.PhoneNumber ?? '',
    nameCoSo: data.nameCoSo ?? n?.nameCoSo ?? '',
  };
}
