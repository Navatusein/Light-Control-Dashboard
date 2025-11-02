// app/actions.ts
"use server";

import { publishAsync, MQTT_BASE } from "@/lib/mqtt";

export type BindingMode = "toggle" | "momentary";
export type BindingItem = { switch: string; leds: number[]; mode: BindingMode };
export type BindingPayload = { bindings: BindingItem[] };

// Публикация всего конфига ОДНИМ сообщением в <BASE>/config/bindings
export async function publishBindingsSingle(all: BindingItem[], opts?: { retain?: boolean }) {
  const topic = `${MQTT_BASE}/config/bindings`;
  const payload: BindingPayload = { bindings: all };
  const json = JSON.stringify(payload);
  await publishAsync(topic, json, { retain: opts?.retain ?? true });
}

// Управление светом оставляем как было (если используется в дашборде)
export async function publishLight(path: string, payload: "ON"|"OFF"|"TOGGLE") {
  const topic = `${MQTT_BASE}/${path}`;
  await publishAsync(topic, payload);
}
