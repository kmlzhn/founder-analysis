import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/contexts/ChatContext";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

const arimo = Arimo({
  subsets: ["latin"],
  variable: "--font-arimo",
});

export const metadata: Metadata = {
  title: "Founder Analysis",
  description: "AI-powered founder potential analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${arimo.variable} font-sans antialiased`}
      >
        <NextSSRPlugin
          routerConfig={extractRouterConfig(ourFileRouter)}
        />
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
