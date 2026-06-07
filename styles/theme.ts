import { fonts } from "./global";

export type ThemePreference = "system" | "light" | "dark";
export type ThemeName = "light" | "dark";

export interface ThemeTokens {
  name: ThemeName;
  isDark: boolean;
  colors: {
    canvas: string;
    surface: string;
    elevatedSurface: string;
    primary: string;
    primaryContainer: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    destructive: string;
    inverseText: string;
    shadow: string;
    overlay: string;
    pressed: string;
  };
  spacing: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: {
    heading: string;
    body: string;
    scientific: string;
  };
  elevation: {
    card: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
}

const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

const radii = {
  sm: 10,
  md: 16,
  lg: 22,
} as const;

const typography = {
  heading: fonts.bold,
  body: fonts.regular,
  scientific: fonts.italic,
} as const;

export const lightTheme: ThemeTokens = {
  name: "light",
  isDark: false,
  colors: {
    canvas: "#F3F1E8",
    surface: "#FFFFFF",
    elevatedSurface: "#FAF8F1",
    primary: "#14794F",
    primaryContainer: "#DEF0E7",
    text: "#111512",
    muted: "#707A72",
    border: "#E6E9E4",
    accent: "#E0A82E",
    destructive: "#B33A3A",
    inverseText: "#FFFFFF",
    shadow: "#10251D",
    overlay: "rgba(6, 12, 9, 0.58)",
    pressed: "rgba(20, 121, 79, 0.12)",
  },
  spacing,
  radii,
  typography,
  elevation: {
    card: {
      shadowColor: "#142018",
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
};

export const darkTheme: ThemeTokens = {
  name: "dark",
  isDark: true,
  colors: {
    canvas: "#0A0D0B",
    surface: "#131714",
    elevatedSurface: "#1A1F1B",
    primary: "#2BB673",
    primaryContainer: "#16301F",
    text: "#F2F5F2",
    muted: "#828C84",
    border: "#232925",
    accent: "#E0A82E",
    destructive: "#FFB4AB",
    inverseText: "#05120B",
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.68)",
    pressed: "rgba(143, 211, 175, 0.16)",
  },
  spacing,
  radii,
  typography,
  elevation: {
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0.24,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
  },
};

export const coerceThemePreference = ( value: unknown ): ThemePreference => (
  value === "light" || value === "dark" || value === "system"
    ? value
    : "system"
);

export const resolveThemeName = (
  preference: ThemePreference,
  systemScheme: "light" | "dark" | null | undefined
): ThemeName => {
  if ( preference === "light" || preference === "dark" ) {
    return preference;
  }
  return systemScheme === "dark" ? "dark" : "light";
};

export const resolveThemeTokens = (
  preference: ThemePreference,
  systemScheme: "light" | "dark" | null | undefined
): ThemeTokens => (
  resolveThemeName( preference, systemScheme ) === "dark" ? darkTheme : lightTheme
);
