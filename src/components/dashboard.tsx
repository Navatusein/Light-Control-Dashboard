"use client";
import { useEffect, useMemo, useState, startTransition } from "react";
import { App as AntApp, Button, Card, ConfigProvider, Flex, Input, Space, Switch, Tag, Typography, message } from "antd";

const { Title, Text } = Typography;

type Props = {
  baseFromServer: string;
  publishLight: (path: string, payload: "ON"|"OFF"|"TOGGLE") => Promise<void>;
};

export default function Dashboard({ baseFromServer, publishLight }: Props) {
  const [connected, setConnected] = useState(false);
  const [leds, setLeds] = useState<("ON"|"OFF")[]>(Array(24).fill("OFF"));
  const [base, setBase] = useState(baseFromServer);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Підписка на SSE
  useEffect(() => {
    const ev = new EventSource("/api/mqtt/stream");
    ev.onmessage = (e) => {
      try {
        const { topic, payload } = JSON.parse(e.data);
        if (topic.endsWith("/availability")) {
          setConnected(payload === "online");
          return;
        }
        // очікуємо <BASE>/lights/<idx>/state
        const parts = topic.split("/");
        const b = parts[0]; // BASE
        if (b !== base) return;
        if (parts[1] === "lights" && parts[3] === "state") {
          const idx = Number(parts[2]);
          if (!Number.isNaN(idx) && idx >= 0 && idx < 24) {
            setLeds(prev => {
              const next = prev.slice();
              next[idx] = payload === "ON" ? "ON" : "OFF";
              return next;
            });
          }
        }
      } catch {}
    };
    ev.onerror = () => setConnected(false);
    return () => ev.close();
  }, [base]);

  // @ts-ignore
  const call = (path: string, payload: "ON"|"OFF"|"TOGGLE") => startTransition(() => publishLight(path, payload).catch(err => message.error(String(err))));

  const setAll = (on: boolean) => call(`lights/all/set`, on ? "ON" : "OFF");
  const toggleAll = () => call(`lights/all/set`, "TOGGLE");
  const toggleOne = (i: number) => call(`lights/${i}/set`, "TOGGLE");
  const setOne = (i: number, on: boolean) => call(`lights/${i}/set`, on ? "ON" : "OFF");

  const StatusTag = useMemo(
    () => <Tag color={connected ? "green" : "default"}>{connected ? "online" : "offline"}</Tag>,
    [connected]
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1677ff", borderRadius: 10 } }}>
      <AntApp>
        <Flex vertical gap={16} style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
          <Flex align="center" justify="space-between">
            <Title level={3} style={{ margin: 0 }}>Light Controller UI</Title>
            <Space><Text type="secondary">MQTT:</Text>{StatusTag}</Space>
          </Flex>

          <Card>
            <Space.Compact>
              <span style={{ padding: "0 8px", background: "#fafafa", border: "1px solid #d9d9d9", borderRight: 0, borderRadius: "6px 0 0 6px", lineHeight: "32px" }}>
                Base topic
              </span>
              <Input style={{ width: 280 }} value={base} onChange={(e) => setBase(e.target.value)} />
              <Button onClick={() => message.info("Підпишіться іншими клієнтами на нову базу (SSE вже слухає все).")}>
                Resubscribe
              </Button>
            </Space.Compact>
          </Card>

          <Flex gap={16} wrap>
            <Card title="Controls" style={{ flex: 1, minWidth: 280 }}>
              <Space>
                <Button type="primary" onClick={() => setAll(true)}>All ON</Button>
                <Button onClick={toggleAll}>All TOGGLE</Button>
                <Button danger onClick={() => setAll(false)}>All OFF</Button>
              </Space>
            </Card>
          </Flex>

          <Card title="LEDs (0..23)">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(80px, 1fr))", gap: 12 }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const on = leds[i] === "ON";
                return (
                  <Card key={i} size="small" hoverable onClick={() => toggleOne(i)}
                        style={{ cursor: "pointer", borderColor: on ? "#52c41a" : undefined, boxShadow: on ? "0 0 0 2px rgba(82,196,26,.2)" : undefined }}
                        title={<span>LED {i}</span>}
                        extra={<Switch checked={on} onClick={(v, e) => {setOne(i, v); e.stopPropagation()}} />}>
                    <Flex vertical>
                      <Typography.Text>Status: {on ? "ON" : "OFF"}</Typography.Text>
                      <Space size="small">
                        <Button size="small" onClick={(e) => { e.stopPropagation(); setOne(i, true); }}>ON</Button>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); toggleOne(i); }}>TOGGLE</Button>
                        <Button size="small" danger onClick={(e) => { e.stopPropagation(); setOne(i, false); }}>OFF</Button>
                      </Space>
                    </Flex>
                  </Card>
                );
              })}
            </div>
          </Card>

          <Card><Text type="secondary">BASE: {base}{mounted ? "" : ""}</Text></Card>
        </Flex>
      </AntApp>
    </ConfigProvider>
  );
}
