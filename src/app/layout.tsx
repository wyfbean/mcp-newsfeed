import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Newsfeed – AI-Powered Information Hub",
  description:
    "Aggregate, rank and act on your daily feed of GitHub PRs, meetings, tasks and more — powered by MCP and AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
