export const colors = {
  // Backgrounds
  bg: {
    primary: "#0a0a0f",
    secondary: "#12121a",
    tertiary: "#1a1a26",
    card: "#1e1e2e",
    elevated: "#252538",
    overlay: "rgba(0,0,0,0.7)",
    glass: "rgba(255,255,255,0.05)",
    glassBorder: "rgba(255,255,255,0.08)",
  },
  // Accent
  accent: {
    primary: "#6c5ce7",
    secondary: "#a29bfe",
    tertiary: "#fd79a8",
    gradient: ["#6c5ce7", "#a29bfe"] as readonly string[],
  },
  // Text
  text: {
    primary: "#ffffff",
    secondary: "rgba(255,255,255,0.7)",
    tertiary: "rgba(255,255,255,0.4)",
    inverse: "#0a0a0f",
  },
  // Status
  status: {
    success: "#00b894",
    warning: "#fdcb6e",
    error: "#e17055",
    info: "#74b9ff",
  },
  // Video badges
  badge: {
    hdr: "#fdcb6e",
    dolby: "#ffffff",
    hd: "#74b9ff",
    "4k": "#e17055",
  },
  // Chromecast
  chromecast: "#74b9ff",
} as const;

export type ColorKey = keyof typeof colors;
