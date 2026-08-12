"use client";

import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#211640",
          color: "#fff7ec",
          border: "1px solid rgba(255,247,236,.16)",
          fontWeight: 600,
          fontSize: 14,
          maxWidth: 440,
          boxShadow: "0 12px 40px rgba(0,0,0,.55)",
        },
        success: { iconTheme: { primary: "#FF6B4A", secondary: "#160e2e" } },
      }}
    />
  );
}
