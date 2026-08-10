import type { Metadata } from "next";
import "./globals.css";
import { SplashScreen } from "./components/SplashScreen";

export const metadata: Metadata = {
  title: "WordFlip",
  description: "App de práctica de vocabulario español-inglés",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-gray-50 font-sans">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
