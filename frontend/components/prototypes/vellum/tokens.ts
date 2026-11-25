export interface VellumTheme {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  muted: string;
  rule: string;
  ruleStrong: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
}

export const VELLUM_LIGHT: VellumTheme = {
  bg: "#F5F2EB",
  surface: "#FBF9F4",
  surfaceAlt: "#EAE5D9",
  ink: "#171614",
  muted: "#615D55",
  rule: "rgba(23, 22, 20, 0.13)",
  ruleStrong: "rgba(23, 22, 20, 0.28)",
  accent: "#C03A17",
  accentSoft: "rgba(192, 58, 23, 0.09)",
  accentInk: "#FFFFFF",
};

export const VELLUM_DARK: VellumTheme = {
  bg: "#131110",
  surface: "#1B1917",
  surfaceAlt: "#25221F",
  ink: "#EFEBE3",
  muted: "#9D968B",
  rule: "rgba(239, 235, 227, 0.13)",
  ruleStrong: "rgba(239, 235, 227, 0.28)",
  accent: "#E56B45",
  accentSoft: "rgba(229, 107, 69, 0.14)",
  accentInk: "#131110",
};

/** P2.2.1 Release Candidate tokens: preserves Vellum identity with WCAG 2.2 AA verified dark & placeholder contrast */
export const VELLUM_LIGHT_RC: VellumTheme = {
  ...VELLUM_LIGHT,
  muted: "#57534B",
  rule: "rgba(23, 22, 20, 0.16)",
  ruleStrong: "rgba(23, 22, 20, 0.34)",
};

export const VELLUM_DARK_RC: VellumTheme = {
  bg: "#131110",
  surface: "#1B1917",
  surfaceAlt: "#25221F",
  ink: "#F4F0E8",
  muted: "#B8B0A4",
  rule: "rgba(239, 235, 227, 0.18)",
  ruleStrong: "rgba(239, 235, 227, 0.38)",
  accent: "#EC7650",
  accentSoft: "rgba(236, 118, 80, 0.18)",
  accentInk: "#131110",
};

export const VELLUM_EASE = [0.22, 1, 0.36, 1] as const;
