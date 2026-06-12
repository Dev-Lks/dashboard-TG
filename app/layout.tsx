import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "TG 11 | Missão Doação de Sangue",
  description: "Agendamento de doação de sangue — TG 11 Ituiutaba.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
