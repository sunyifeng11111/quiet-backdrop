import type { AnalyticsEvent, AnalyticsEventName } from '../types';

const STORAGE_KEY = 'quietbackdrop:analytics';
const LEGACY_STORAGE_KEY = 'frameground:analytics';
const allowedProperties = new Set(['renderer', 'category', 'aspectRatio', 'resolution', 'fps', 'duration', 'mobile', 'streaming', 'reason']);

const sanitize = (properties?: Record<string, string | number | boolean>) => {
  if (!properties) return undefined;
  return Object.fromEntries(Object.entries(properties).filter(([key]) => allowedProperties.has(key)));
};

export const track = (name: AnalyticsEventName, properties?: Record<string, string | number | boolean>) => {
  const event: AnalyticsEvent = { name, timestamp: Date.now(), properties: sanitize(properties) };
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY) ?? '[]') as AnalyticsEvent[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...queue.slice(-99), event]));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([event]));
  }
  window.dispatchEvent(new CustomEvent('quietbackdrop:analytics', { detail: event }));
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  if (endpoint) navigator.sendBeacon(endpoint, JSON.stringify(event));
};
