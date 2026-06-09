import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/shared/AuthProvider";

export const metadata: Metadata = {
  title: "EaseMyPrompt.ai — Engineer Prompts Like a Pro",
  description: "Turn any idea into a precision-crafted AI prompt in seconds. Derek is your always-on AI prompt engineer.",
};

// Script runs synchronously before paint — applies saved theme preference, defaults to light
const themeScript = `
  try {
    var t = localStorage.getItem('emp-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  } catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;1,14..32,400&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Blocking script prevents FOUC */}
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <body
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          transition: "background-color 0.3s ease, color 0.3s ease",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
        <div
          style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            fontSize: "12px",
            opacity: 0.4,
            zIndex: 9999,
            pointerEvents: "none",
            fontFamily: "inherit",
          }}
        >
          Built by Aryan
        </div>
      </body>
    </html>
  );
}
