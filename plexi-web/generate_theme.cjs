const fs = require('fs');

const lightColors = {
  "surface-container-low": "#f3f4f5",
  "primary-fixed": "#d7e2ff",
  "surface-dim": "#d9dadb",
  "surface-container": "#edeeef",
  "primary": "#003f87",
  "primary-container": "#0056b3",
  "on-secondary-container": "#4e6874",
  "secondary-fixed-dim": "#afcbd8",
  "inverse-primary": "#acc7ff",
  "surface-tint": "#115cb9",
  "secondary": "#48626e",
  "error": "#ba1a1a",
  "tertiary-fixed-dim": "#ffb694",
  "on-background": "#191c1d",
  "inverse-on-surface": "#f0f1f2",
  "tertiary-fixed": "#ffdbcc",
  "primary-fixed-dim": "#acc7ff",
  "surface": "#f8f9fa",
  "on-primary": "#ffffff",
  "on-secondary": "#ffffff",
  "secondary-fixed": "#cbe7f5",
  "tertiary-container": "#983c00",
  "secondary-container": "#cbe7f5",
  "on-surface": "#191c1d",
  "surface-container-highest": "#e1e3e4",
  "on-error": "#ffffff",
  "background": "#f8f9fa",
  "on-primary-fixed": "#001a40",
  "on-tertiary-fixed": "#351000",
  "error-container": "#ffdad6",
  "surface-container-high": "#e7e8e9",
  "on-tertiary": "#ffffff",
  "on-tertiary-fixed-variant": "#7b2f00",
  "on-tertiary-container": "#ffc2a7",
  "on-secondary-fixed": "#021f29",
  "surface-variant": "#e1e3e4",
  "outline": "#727784",
  "on-surface-variant": "#424752",
  "on-secondary-fixed-variant": "#304a55",
  "on-primary-fixed-variant": "#004491",
  "outline-variant": "#c2c6d4",
  "surface-container-lowest": "#ffffff",
  "surface-bright": "#f8f9fa",
  "inverse-surface": "#2e3132",
  "tertiary": "#722b00",
  "on-error-container": "#93000a",
  "on-primary-container": "#bbd0ff"
};

const darkColors = {
  "tertiary-fixed-dim": "#dfc299",
  "primary": "#7fd2e8",
  "surface-container": "#132030",
  "on-secondary-container": "#9eb7d8",
  "on-tertiary": "#3f2d0f",
  "on-primary": "#003640",
  "inverse-primary": "#00687a",
  "on-secondary": "#17324d",
  "on-tertiary-container": "#a28963",
  "surface-container-low": "#0f1c2c",
  "on-error": "#690005",
  "primary-fixed": "#abedff",
  "surface-tint": "#7fd2e8",
  "on-primary-container": "#4198ac",
  "secondary": "#afc9ea",
  "inverse-surface": "#d6e4f9",
  "secondary-fixed": "#d1e4ff",
  "error-container": "#93000a",
  "surface-bright": "#2d3a4a",
  "on-surface-variant": "#c5c6cd",
  "surface": "#061423",
  "surface-variant": "#283646",
  "on-secondary-fixed": "#001d36",
  "secondary-container": "#2f4865",
  "tertiary-fixed": "#fcdeb3",
  "on-background": "#d6e4f9",
  "primary-fixed-dim": "#7fd2e8",
  "outline-variant": "#45474d",
  "inverse-on-surface": "#243141",
  "on-secondary-fixed-variant": "#2f4865",
  "on-error-container": "#ffdad6",
  "background": "#061423",
  "tertiary-container": "#332306",
  "on-surface": "#d6e4f9",
  "on-primary-fixed": "#001f26",
  "on-tertiary-fixed-variant": "#574423",
  "primary-container": "#002b33",
  "surface-container-high": "#1e2b3b",
  "surface-container-highest": "#283646",
  "surface-container-lowest": "#020f1e",
  "on-primary-fixed-variant": "#004e5c",
  "outline": "#8f9097",
  "on-tertiary-fixed": "#271901",
  "tertiary": "#dfc299",
  "error": "#ffb4ab",
  "secondary-fixed-dim": "#afc9ea",
  "surface-dim": "#061423"
};

let css = `:root, [data-theme="light"] {\n`;
for (const [key, value] of Object.entries(lightColors)) {
  css += `  --color-${key}: ${value};\n`;
}
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

fs.writeFileSync('theme.css', css);

let tailwindColors = {};
for (const key of Object.keys(lightColors)) {
  tailwindColors[key] = `var(--color-${key})`;
}
fs.writeFileSync('tailwind-colors.json', JSON.stringify(tailwindColors, null, 2));
