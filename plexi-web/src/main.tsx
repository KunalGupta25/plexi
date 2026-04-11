import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { SettingsProvider } from "./hooks/useSettings";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
