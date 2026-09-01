import "./globals.css";
import type { Metadata } from "next";
import { Titlebar } from "@/components/titlebar";

export const metadata: Metadata = {
  title: "Wifu Engine",
  description: "Transparent overlay creator for Windows / MacOS / Linux",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0d14] text-slate-100 flex flex-col h-screen w-screen overflow-hidden antialiased">
        <Titlebar />
        <div className="flex-1 flex overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
