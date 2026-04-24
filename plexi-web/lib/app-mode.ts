"use client";

const APP_MODE_KEY = "plexi_app_mode";
const DASHBOARD_MODE_KEY = "plexi_dashboard_mode";

export function isAppModeEnabled() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(APP_MODE_KEY) === "1";
}

export function setAppMode(enabled: boolean) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.localStorage.setItem(APP_MODE_KEY, "1");
  } else {
    window.localStorage.removeItem(APP_MODE_KEY);
  }
}

export function isDashboardModeEnabled() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(DASHBOARD_MODE_KEY) === "1";
}

export function setDashboardMode(enabled: boolean) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.localStorage.setItem(DASHBOARD_MODE_KEY, "1");
  } else {
    window.localStorage.removeItem(DASHBOARD_MODE_KEY);
  }
}

export function captureAppModeFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const appMode = params.get("app");

  if (appMode === "1" || appMode === "true") {
    setAppMode(true);
    return true;
  }

  if (appMode === "0" || appMode === "false") {
    setAppMode(false);
    return false;
  }

  return isAppModeEnabled();
}

export function captureDashboardModeFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const dashboardMode = params.get("dashboard");

  if (dashboardMode === "1" || dashboardMode === "true") {
    setDashboardMode(true);
    return true;
  }

  if (dashboardMode === "0" || dashboardMode === "false") {
    setDashboardMode(false);
    return false;
  }

  return isDashboardModeEnabled();
}
