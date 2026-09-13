export type ToastTone = "success" | "error" | "info";

export type ToastOptions = {
  action?: { label: string; onClick: () => void };
};

export type ToastMessage = ToastOptions & {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastListener = (message: ToastMessage) => void;

const listeners = new Set<ToastListener>();
let nextId = 0;

function publish(tone: ToastTone, message: string, options: ToastOptions = {}) {
  nextId += 1;
  const item: ToastMessage = { id: nextId, message, tone, ...options };
  listeners.forEach((listener) => listener(item));
  return item.id;
}

export const toast = {
  success: (message: string, options?: ToastOptions) => publish("success", message, options),
  error: (message: string, options?: ToastOptions) => publish("error", message, options),
  info: (message: string, options?: ToastOptions) => publish("info", message, options),
};

export function subscribeToToasts(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
