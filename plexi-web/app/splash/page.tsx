"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  captureAppModeFromSearch,
  captureDashboardModeFromSearch,
} from "@/lib/app-mode";

export default function SplashPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    captureAppModeFromSearch(window.location.search);
    captureDashboardModeFromSearch(window.location.search);

    const timer = setTimeout(() => {
      router.push("/home");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!mounted) return null;

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="relative flex flex-col items-center">
        {/* Logo Container */}
        <div className="relative mb-12">
          {/* Animated Glow */}
          <div className="absolute -inset-8 rounded-[3rem] bg-primary/20 blur-3xl animate-pulse" />

          <div className="relative flex h-56 w-56 items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isDark ? "/icon-dark.svg" : "/icon-light.svg"}
              alt="Plexi Logo"
              className="h-full w-full object-contain animate-bounce"
            />
          </div>
        </div>
        {/* Text Content */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Plexi
          </h1>
          <p className="text-muted-foreground font-medium tracking-wide opacity-80">
            Your AI Study Companion
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-[3000ms] ease-out"
              style={{
                width: mounted ? "100%" : "0%",
                animation: "loading-bar 3s ease-in-out forwards",
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">
            Initializing Study Hub
          </span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
