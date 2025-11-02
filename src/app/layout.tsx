import '@ant-design/v5-patch-for-react-19';

export const metadata = { title: "Light Controller UI", description: "ESP32 MQTT Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-lt-installed="true">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
