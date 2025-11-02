"use client";

import { useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Space, Typography } from "antd";
import type { BindingItem, BindingMode } from "@/app/actions";
import { publishBindingsSingle } from "@/app/actions";

const { Title, Text } = Typography;

const LED_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ label: `LED ${i}`, value: i }));
const MODE_OPTIONS = [
  { label: "toggle (кнопка)", value: "toggle" },
  { label: "momentary (вимикач)", value: "momentary" },
] as const;

type Props = { baseFromServer: string };

function makeDefaultBindings(): BindingItem[] {
  const btns: BindingItem[] = Array.from({ length: 8 }, (_, i) => ({
    switch: `sw1/btn${i + 1}`, leds: [i], mode: "toggle",
  }));
  const sws: BindingItem[] = Array.from({ length: 8 }, (_, i) => ({
    switch: `sw1/sw${i + 1}`, leds: [8 + i, 16 + i], mode: "momentary",
  }));
  return [...btns, ...sws];
}

export default function BindingsEditor({ baseFromServer }: Props) {
  const [form] = Form.useForm();
  const initial = useMemo(() => makeDefaultBindings(), []);
  const [bindings, setBindings] = useState<BindingItem[]>(initial);

  const onSubmitSingle = async () => {
    const values = await form.validateFields();
    const rows = (values.rows || []) as BindingItem[];
    await publishBindingsSingle(rows, { retain: true });
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={16}>
      <Card>
        <Title level={4} style={{ margin: 0 }}>Налаштування зв’язків</Title>
        <Text type="secondary">Базовий топік: {baseFromServer}</Text>
      </Card>

      <Card>
        <Space>
          <Button onClick={() => { form.setFieldsValue({ rows: makeDefaultBindings() })}}>
            Завантажити дефолт
          </Button>
          <Button type="primary" onClick={onSubmitSingle}>
            Опублікувати одним повідомленням
          </Button>
        </Space>
      </Card>

      <Card>
        <Form form={form} initialValues={{ rows: bindings }} layout="vertical" onValuesChange={(_, all) => setBindings(all.rows)}>
          <Form.List name="rows">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 12 }} title={`Правило #${name + 1}`}
                        extra={<Button danger size="small" onClick={() => remove(name)}>Видалити</Button>}>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Form.Item
                        {...rest}
                        name={[name, "switch"]}
                        label="Вхід (switch): ctrlId/btnId або ctrlId/swId"
                        rules={[{ required: true, message: "Вкажіть switch" }]}
                      >
                        <Input placeholder="sw1/btn1 або sw1/sw3" />
                      </Form.Item>

                      <Form.Item
                        {...rest}
                        name={[name, "mode"]}
                        label="Режим"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={[
                            { label: "toggle (кнопка)", value: "toggle" },
                            { label: "momentary (вимикач)", value: "momentary" },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        {...rest}
                        name={[name, "leds"]}
                        label="Цільові LED-и"
                        rules={[{ required: true, message: "Оберіть хоча б один LED" }]}
                      >
                        <Select mode="multiple" allowClear placeholder="Оберіть 0..23" options={LED_OPTIONS} />
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button onClick={() => add({ switch: "", leds: [], mode: "toggle" })}>Додати правило</Button>
              </>
            )}
          </Form.List>
        </Form>
      </Card>

      <Card>
        <Text type="secondary">
          Відправляємо один JSON у топік <code>{baseFromServer}/config/bindings</code> (retained).
        </Text>
      </Card>
    </Space>
  );
}
