import BindingsEditor from "@/components/bindings-editor";

export const metadata = {
  title: "Switches Config",
  description: "Налаштування зв’язків вимикачів із LED",
};

export default function Page() {
  const baseFromServer = process.env.MQTT_BASE_TOPIC || "Fc3";
  return <BindingsEditor baseFromServer={baseFromServer} />;
}
