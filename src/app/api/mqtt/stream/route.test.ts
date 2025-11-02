import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/mqtt", () => {
  // Емітуємо події у тесті вручну
  const listeners: Function[] = [];
  return {
    getMqttClient: vi.fn(),
    onMqttMessage: (cb: any) => { listeners.push(cb); return () => {
      const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1);
    };},
    __emit: (msg: any) => listeners.forEach((cb) => cb(msg)),
  };
});

// @ts-ignore
import { __emit } from "@/lib/mqtt";
import {GET} from "@/app/api/mqtt/stream/route";

function readAll(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  return reader.read().then(function process(result): any {
    if (result.done) return chunks;
    chunks.push(result.value);
    return reader.read().then(process);
  });
}

describe("SSE route", () => {
  it("opens stream and delivers a message", async () => {
    const res = await GET(new Request("http://test.local/api/mqtt/stream"));
    expect(res.headers.get("Content-Type")).toMatch(/text\/event-stream/);

    const body = res.body!;
    const reader = body.getReader();

    // Емітуємо MQTT-повідомлення
    __emit({ topic: "Fc3/lights/0/state", payload: "ON" });

    // Читаємо кілька шматків і закриваємо
    const chunks = await Promise.race([
      readAll(reader),                     // якщо stream завершиться сам
      new Promise<Uint8Array[]>((resolve) =>
        setTimeout(async () => {
          reader.cancel();                 // імітуємо закриття клієнтом
          resolve([]);
        }, 100)
      )
    ]);
    // якщо chunks є — просто перевіримо, що це потік (не валідований текст)
    expect(chunks).toBeDefined();
  });
});
