import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/app/globals.css"; // Подключение глобальных стилей

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
