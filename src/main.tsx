import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/noto-sans-tamil/400.css";
import "./index.css";
import TamilLernen from "./lernen/TamilLernen";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TamilLernen />
  </StrictMode>,
);
