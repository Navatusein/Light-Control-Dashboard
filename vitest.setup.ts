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
  onopen: ((ev: any) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  private listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
    // емулюємо open асинхронно
    setTimeout(() => this.onopen && this.onopen({}), 0);
  }

  addEventListener(type: string, cb: any) {
    (this.listeners[type] ||= []).push(cb);
  }

  removeEventListener(type: string, cb: any) {
    this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== cb);
  }

  // корисно у тестах вручну емулювати прихід повідомлення:
  __emit(data: any) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    const ev = { data: payload } as MessageEvent;
    this.onmessage && this.onmessage(ev);
    (this.listeners["message"] || []).forEach((cb) => cb(ev));
  }

  close() {
    this.readyState = 2; // CLOSED
  }
}

global.EventSource = FakeEventSource as any;

window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } } as any;
};

// Якщо якийсь компонент викликає fetch SSE — заглушка
globalThis.fetch = globalThis.fetch || (vi.fn(async () => new Response("", { status: 200 })) as any);
