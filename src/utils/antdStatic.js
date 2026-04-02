import { App } from 'antd';

let message;
let notification;
let modal;

/**
 * Component to capture the antd app instance and expose message, notification, and modal
 * to non-component functions. Useful for API utilities and other non-React code.
 */
export default function AntdStaticHelper() {
  const staticFunction = App.useApp();
  message = staticFunction.message;
  notification = staticFunction.notification;
  modal = staticFunction.modal;
  return null;
}

export const staticMessage = {
  success: (...args) => message?.success?.(...args),
  error: (...args) => message?.error?.(...args),
  warning: (...args) => message?.warning?.(...args),
  info: (...args) => message?.info?.(...args),
  loading: (...args) => message?.loading?.(...args),
  loading2: (...args) => message?.loading?.(...args),
};

export const staticNotification = {
  success: (...args) => notification?.success?.(...args),
  error: (...args) => notification?.error?.(...args),
  warning: (...args) => notification?.warning?.(...args),
  info: (...args) => notification?.info?.(...args),
};

export const staticModal = {
  confirm: (...args) => modal?.confirm?.(...args),
  error: (...args) => modal?.error?.(...args),
  success: (...args) => modal?.success?.(...args),
  warning: (...args) => modal?.warning?.(...args),
  info: (...args) => modal?.info?.(...args),
};
