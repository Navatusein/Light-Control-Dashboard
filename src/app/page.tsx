// app/page.tsx


import {publishLight} from "@/app/actions";
import Dashboard from "@/components/dashboard";

export default function Page() {
  const baseFromServer = process.env.MQTT_BASE_TOPIC || "Fc3";
  // Server Component рендерить Client Component і передає експортовану Server Action як проп
  return <Dashboard baseFromServer={baseFromServer} publishLight={publishLight} />;
}