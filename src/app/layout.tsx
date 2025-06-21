import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { ScrollToTopButton } from "@/components/ScrollToTopButton"; // Import the new component

const geistSans = GeistSans;

export const metadata: Metadata = {
  title: "JobsAI",
  description: "AI-Powered Job Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <main>{children}</main>
          <Toaster />
          <ChatbotWidget />
          <ScrollToTopButton /> {/* Add the scroll to top button here */}
        </QueryProvider>
      </body>
    </html>
  );
}
