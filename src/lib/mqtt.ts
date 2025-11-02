// lib/mqtt.ts
import mqtt, { MqttClient, IClientOptions } from "mqtt";
import { EventEmitter } from "node:events";

const BASE = process.env.MQTT_BASE_TOPIC || "Fc3";
const URL  = process.env.MQTT_URL || "tcp://broker.hivemq.com:1883";
const USER = process.env.MQTT_USERNAME || "";
const PASS = process.env.MQTT_PASSWORD || "";

let client: MqttClient | null = null;
const bus = new EventEmitter();

export function getMqttClient(): MqttClient {
  if (client) return client;

  const opts: IClientOptions = {
    username: USER || undefined,
    password: PASS || undefined,
    clean: true,
    reconnectPeriod: 1500,
    connectTimeout: 10_000,
    clientId: `next-server-${Math.random().toString(16).slice(2, 8)}`
  };

  client = mqtt.connect(URL, opts);

  client.on("connect", () => {
    client!.subscribe([`${BASE}/lights/+/state`, `${BASE}/controller/availability`]);
  });

  client.on("message", (topic, payload) => {
    bus.emit("message", { topic, payload: payload.toString() });
  });

  client.on("error", (e) => {
    bus.emit("message", { topic: "internal/error", payload: String(e) });
  });

  return client;
}

export function onMqttMessage(cb: (m: {topic: string; payload: string}) => void) {
  bus.on("message", cb);
  return () => bus.off("message", cb);
}

export function publishAsync(topic: string, payload: string, opts?: { retain?: boolean; qos?: 0|1|2 }): Promise<void> {
  const c = getMqttClient();
  return new Promise((res, rej) => {
    c.publish(topic, payload, { retain: !!opts?.retain, qos: opts?.qos ?? 0 }, (err) => err ? rej(err) : res());
  });
}

export const MQTT_BASE = BASE;
