import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";
import { initCapacitor } from "./lib/capacitor";

// Initialize native plugins if running in Capacitor
initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
