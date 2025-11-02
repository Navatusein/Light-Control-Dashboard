import "@testing-library/jest-dom";
import { vi } from "vitest";

// mock next/navigation (якщо потрібно компонентам)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

// jsdom не має EventSource — зробимо простий мок
class FakeEventSource {
  url: string;
  readyState = 1; // OPEN
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onopen: ((ev: any) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((ev: any) => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
    // емулюємо open асинхронно
    setTimeout(() => this.onopen && this.onopen({}), 0);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener(type: string, cb: any) {
    (this.listeners[type] ||= []).push(cb);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeEventListener(type: string, cb: any) {
    this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== cb);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __emit(data: any) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    const ev = { data: payload } as MessageEvent;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.onmessage && this.onmessage(ev);
    (this.listeners["message"] || []).forEach((cb) => cb(ev));
  }

  close() {
    this.readyState = 2; // CLOSED
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.EventSource = FakeEventSource as any;

class MockEventSource {
  static instances: MockEventSource[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static __broadcastJSON(data: any) {
    for (const i of MockEventSource.instances) i.__emit(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onopen: ((ev?: any) => any) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onmessage: ((ev: MessageEvent) => any) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((ev?: any) => any) | null = null;
  readyState = 1;
  url: string;
  withCredentials = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    Promise.resolve().then(() => this.onopen?.({}));
  }
  close() { this.readyState = 2; }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  __emit(raw: any) {
    // Компонент очікує { topic, payload }, тому кодуємо як SSE data:
    this.onmessage?.({ data: JSON.stringify(raw) } as MessageEvent);
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).EventSource = MockEventSource;

window.matchMedia = window.matchMedia || function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } } as any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.fetch = globalThis.fetch || (vi.fn(async () => new Response("", { status: 200 })) as any);
