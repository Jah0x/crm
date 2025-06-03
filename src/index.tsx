// src/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/app/globals.css"; // Подключение Tailwind-глобала и theme.css-переменных

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
