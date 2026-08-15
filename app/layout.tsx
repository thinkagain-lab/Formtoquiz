import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FormToQuiz — Turn anything into a quiz",
  description:
    "Turn any text, PDF, or YouTube video into a ready-to-use Google Form quiz in seconds using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
