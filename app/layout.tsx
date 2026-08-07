import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordFlip",
  description: "App de práctica de vocabulario español-inglés",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-gray-50 font-sans">{children}</body>
    </html>
  );
}
