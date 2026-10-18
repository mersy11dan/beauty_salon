"use client";

/** Shown when even the root layout fails, e.g. the database is unreachable. Global CSS isn't loaded here. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#F5F1F2",
          color: "#1E181C",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <title>We&apos;ll be right back</title>
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 10px" }}>We&apos;ll be right back</h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "#6b6870", margin: "0 0 24px" }}>
            The site couldn&apos;t load just now. Please try again in a moment, or call the salon to book.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ height: 44, padding: "0 24px", borderRadius: 999, border: 0, background: "#6E2B3F", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
