import type { Metadata, Viewport } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuthR — Authorship Representation Protocol v0.1",
  description:
    "AuthR is the third pillar of identity. AuthN asks who you are. AuthZ asks what you can do. AuthR asks whose judgment drove the decision — and proves it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('authr-theme');if(t==='light'){document.documentElement.dataset.theme='light';}else{delete document.documentElement.dataset.theme;if(!t)localStorage.setItem('authr-theme','dark');}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <Nav />
        {children}
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "1.5rem 2rem",
            marginTop: "4rem",
          }}
        >
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-dim)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span>AuthR Protocol v0.1 — Identient Corp</span>
            <span>authr-spec-v0.1 | playground.identient.com/authr</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
