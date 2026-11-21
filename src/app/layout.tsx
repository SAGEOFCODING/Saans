import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saans (सांस) — Clean-Air Copilot',
  description: 'GenAI-powered clean-air assistant for severe winter smog and urban air pollution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-haze text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky focus:text-on-sky focus:rounded-control"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
