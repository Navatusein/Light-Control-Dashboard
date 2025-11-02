// app/api/mqtt/stream/route.ts
import { NextResponse } from "next/server";
import { onMqttMessage, getMqttClient } from "@/lib/mqtt";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  getMqttClient(); // ініціалізує підписки в сінглтоні

  let closed = false;
  let off: (() => void) | null = null;
  let hb: any = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();

      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          // controller уже закритий/помилка – закриваємося акуратно
          cleanup();
        }
      };

      const send = (obj: any) => safeEnqueue(`data: ${JSON.stringify(obj)}\n\n`);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        try { if (off) off(); } catch {}
        try { if (hb) clearInterval(hb); } catch {}
        try { controller.close(); } catch {}
      };

      // MQTT -> SSE
      off = onMqttMessage(({ topic, payload }) => {
        // якщо стрім уже закрився, просто ігноруємо
        if (!closed) send({ topic, payload });
      });

      // перше повідомлення
      send({ topic: "internal/ready", payload: "ok" });

      // heartbeat кожні 15с
      hb = setInterval(() => safeEnqueue(`: ping\n\n`), 15000);

      // @ts-expect-error
      controller.oncancel = cleanup;
      // @ts-expect-error
      controller.onclose = cleanup;

      // аборт HTTP-запиту (важливо для Next)
      request.signal.addEventListener("abort", cleanup);
    },

    cancel() {
      // страховка, якщо cancel викличуть явно
      closed = true;
      try { if (off) off(); } catch {}
      try { if (hb) clearInterval(hb); } catch {}
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
