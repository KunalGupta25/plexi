const fs = require("fs");

const lightColors = {
  "surface-container-low": "#f3f4f5",
  "primary-fixed": "#d7e2ff",
  "surface-dim": "#d9dadb",
  "surface-container": "#edeeef",
  primary: "#003f87",
  "primary-container": "#0056b3",
  "on-secondary-container": "#4e6874",
  "secondary-fixed-dim": "#afcbd8",
  "inverse-primary": "#acc7ff",
  "surface-tint": "#115cb9",
  secondary: "#48626e",
  error: "#ba1a1a",
  "tertiary-fixed-dim": "#ffb694",
  "on-background": "#191c1d",
  "inverse-on-surface": "#f0f1f2",
  "tertiary-fixed": "#ffdbcc",
  "primary-fixed-dim": "#acc7ff",
  surface: "#f8f9fa",
  "on-primary": "#ffffff",
  "on-secondary": "#ffffff",
  "secondary-fixed": "#cbe7f5",
  "tertiary-container": "#983c00",
  "secondary-container": "#cbe7f5",
  "on-surface": "#191c1d",
  "surface-container-highest": "#e1e3e4",
  "on-error": "#ffffff",
  background: "#f8f9fa",
  "on-primary-fixed": "#001a40",
  "on-tertiary-fixed": "#351000",
  "error-container": "#ffdad6",
  "surface-container-high": "#e7e8e9",
  "on-tertiary": "#ffffff",
  "on-tertiary-fixed-variant": "#7b2f00",
  "on-tertiary-container": "#ffc2a7",
  "on-secondary-fixed": "#021f29",
  "surface-variant": "#e1e3e4",
  outline: "#727784",
  "on-surface-variant": "#424752",
  "on-secondary-fixed-variant": "#304a55",
  "on-primary-fixed-variant": "#004491",
  "outline-variant": "#c2c6d4",
  "surface-container-lowest": "#ffffff",
  "surface-bright": "#f8f9fa",
  "inverse-surface": "#2e3132",
  tertiary: "#722b00",
  "on-error-container": "#93000a",
  "on-primary-container": "#bbd0ff",
};

const darkColors = {
  "tertiary-fixed-dim": "#dfc299",
  primary: "#6366F1",
  "primary-hover": "#5558E6",
  "surface-container": "#1E293B",
  "on-secondary-container": "#94A3B8",
  "on-tertiary": "#3f2d0f",
  "on-primary": "#FFFFFF",
  "inverse-primary": "#6366F1",
  "on-secondary": "#0F172A",
  "on-tertiary-container": "#a28963",
  "surface-container-low": "#0F172A",
  "on-error": "#FFFFFF",
  "primary-fixed": "#6366F1",
  "surface-tint": "#6366F1",
  "on-primary-container": "#E2E8F0",
  secondary: "#94A3B8",
  "inverse-surface": "#E2E8F0",
  "secondary-fixed": "#E2E8F0",
  "error-container": "#EF4444",
  "surface-bright": "#1E293B",
  "on-surface-variant": "#94A3B8",
  surface: "#1E293B",
  "surface-variant": "#1E293B",
  "on-secondary-fixed": "#0F172A",
  "secondary-container": "#1E293B",
  "tertiary-fixed": "#fcdeb3",
  "on-background": "#E2E8F0",
  "primary-fixed-dim": "#6366F1",
  "outline-variant": "#334155",
  "inverse-on-surface": "#0F172A",
  "on-secondary-fixed-variant": "#94A3B8",
  "on-error-container": "#EF4444",
  background: "#0F172A",
  "tertiary-container": "#332306",
  "on-surface": "#E2E8F0",
  "on-primary-fixed": "#0F172A",
  "on-tertiary-fixed-variant": "#574423",
  "primary-container": "#6366F1",
  "surface-container-high": "#1E293B",
  "surface-container-highest": "#334155",
  "surface-container-lowest": "#0F172A",
  "on-primary-fixed-variant": "#6366F1",
  outline: "#94A3B8",
  "on-tertiary-fixed": "#271901",
  tertiary: "#dfc299",
  error: "#EF4444",
  "secondary-fixed-dim": "#94A3B8",
  "surface-dim": "#0F172A",
};

let css = `:root, [data-theme="light"] {\n`;
for (const [key, value] of Object.entries(lightColors)) {
  css += `  --color-${key}: ${value};\n`;
}
css += `}\n\n`;

// Add study-focused variables to root for easy access
css += `:root {\n`;
css += `  --bg-main: #0F172A;\n`;
css += `  --bg-surface: #1E293B;\n`;
css += `  --primary: #6366F1;\n`;
css += `  --primary-hover: #5558E6;\n`;
css += `  --text-main: #E2E8F0;\n`;
css += `  --text-muted: #94A3B8;\n`;
css += `  --border: #334155;\n`;
css += `  --success: #22C55E;\n`;
css += `  --error: #EF4444;\n`;
css += `}\n\n`;

css += `[data-theme="dark"], @media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n`;
for (const [key, value] of Object.entries(darkColors)) {
  css += `    --color-${key}: ${value};\n`;
}
css += `  }\n}\n\n`;
css += `[data-theme="dark"] {\n`;
for (const [key, value] of Object.entries(darkColors)) {
  css += `  --color-${key}: ${value};\n`;
}
css += `}\n`;

fs.writeFileSync("theme.css", css);

let tailwindColors = {};
for (const key of Object.keys(lightColors)) {
  tailwindColors[key] = `var(--color-${key})`;
}
fs.writeFileSync(
  "tailwind-colors.json",
  JSON.stringify(tailwindColors, null, 2),
);
