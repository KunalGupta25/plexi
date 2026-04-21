"use client";

import {
  Download,
  Laptop,
  Smartphone,
  Globe,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Workflow,
  Sigma,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const RELEASE_URL = "https://github.com/KunalGupta25/plexi/releases/latest";

const platforms = [
  {
    title: "Windows App",
    description:
      "Install Plexi as a desktop app for a focused study workspace on your laptop or PC.",
    icon: Laptop,
  },
  {
    title: "Android App",
    description:
      "Use Plexi on your phone with an app-like experience for quick access anywhere.",
    icon: Smartphone,
  },
  {
    title: "PWA",
    description:
      "Install from the browser and run Plexi like an app without opening a browser tab each time.",
    icon: Globe,
  },
];

const benefits = [
  "No need to open the browser again and again.",
  "A ready-to-use dashboard with personalized experience without sign-in.",
  "Frequent feature updates to keep your study flow more personalized.",
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen px-4 py-12 pb-24 pt-14 md:min-h-screen md:pb-12 md:pt-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>Download Plexi</span>
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Get Plexi Across Platforms
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Plexi is currently available for Windows, Android, and as a
            Progressive Web App (PWA). Install once and continue learning with a
            faster, app-like experience.
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.title}
                className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{platform.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {platform.description}
                </p>
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5" />
              </div>
            );
          })}
        </div>

        <div className="mb-10 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Why install Plexi?</h2>
          </div>
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-10 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Latest Update</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                <Workflow className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">
                Flow Charts Support
              </h3>
              <p className="text-sm text-muted-foreground">
                Chat with AI and get clearer, visual-style flow explanations for
                faster understanding.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                <Sigma className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">
                Math Equation Support
              </h3>
              <p className="text-sm text-muted-foreground">
                AI responses now handle equations better for solving, reviewing,
                and studying math-heavy topics.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-2xl font-bold">App Screenshots</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <figure className="overflow-hidden rounded-xl border border-border bg-background">
              <img
                src="/download/dashbord-light.png"
                alt="Plexi app screenshot in light mode"
                className="h-auto w-full object-cover"
              />
              <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                Light mode dashboard
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-xl border border-border bg-background">
              <img
                src="/download/dashbaord-dark.png"
                alt="Plexi app screenshot in dark mode"
                className="h-auto w-full object-cover"
              />
              <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                Dark mode dashboard
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-6 text-center md:p-8">
          <h2 className="mb-2 text-2xl font-bold">Download now</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Get the latest Plexi release build from GitHub.
          </p>
          <Button className="rounded-xl" size="lg" asChild>
            <a href={RELEASE_URL} target="_blank" rel="noopener noreferrer">
              Open Latest Release
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
