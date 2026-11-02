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
    // Material 3 roles (tonal scheme from the Seek green; tertiary = Seek gold)
    onPrimary: string;
    onPrimaryContainer: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    tertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    onSurfaceVariant: string;
    outline: string;
    outlineVariant: string;
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

// M3 shape scale: small 8 / medium 12-16 / large 28 (sheets, images, big cards)
const radii = {
  sm: 12,
  md: 16,
  lg: 28,
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
    canvas: "#F5FBF4",
    surface: "#EFF5EE",
    elevatedSurface: "#E9EFE8",
    primary: "#14794F",
    primaryContainer: "#A6F2C8",
    text: "#171D19",
    muted: "#404943",
    border: "#DDE5DC",
    accent: "#C99520",
    destructive: "#BA1A1A",
    inverseText: "#FFFFFF",
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.32)",
    pressed: "rgba(20, 121, 79, 0.12)",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#002113",
    secondaryContainer: "#D0E8D7",
    onSecondaryContainer: "#0B1F15",
    tertiary: "#7B5800",
    tertiaryContainer: "#FFDEA6",
    onTertiaryContainer: "#271900",
    surfaceContainerLow: "#EFF5EE",
    surfaceContainer: "#E9EFE8",
    surfaceContainerHigh: "#E3EAE3",
    surfaceContainerHighest: "#DEE4DD",
    onSurfaceVariant: "#404943",
    outline: "#707973",
    outlineVariant: "#BFC9C1",
  },
  spacing,
  radii,
  typography,
  elevation: {
    // M3 filled cards: tonal surfaces instead of drop shadows
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
  },
};

export const darkTheme: ThemeTokens = {
  name: "dark",
  isDark: true,
  colors: {
    canvas: "#0F1511",
    surface: "#171D19",
    elevatedSurface: "#1B211D",
    primary: "#8AD6AD",
    primaryContainer: "#005235",
    text: "#DEE4DD",
    muted: "#BFC9C1",
    border: "#2A302C",
    accent: "#EDC060",
    destructive: "#FFB4AB",
    inverseText: "#003822",
    shadow: "#000000",
    overlay: "rgba(0, 0, 0, 0.6)",
    pressed: "rgba(138, 214, 173, 0.12)",
    onPrimary: "#003822",
    onPrimaryContainer: "#A6F2C8",
    secondaryContainer: "#364B3E",
    onSecondaryContainer: "#D0E8D7",
    tertiary: "#EDC060",
    tertiaryContainer: "#5D4200",
    onTertiaryContainer: "#FFDEA6",
    surfaceContainerLow: "#171D19",
    surfaceContainer: "#1B211D",
    surfaceContainerHigh: "#252B27",
    surfaceContainerHighest: "#303632",
    onSurfaceVariant: "#BFC9C1",
    outline: "#89938C",
    outlineVariant: "#404943",
  },
  spacing,
  radii,
  typography,
  elevation: {
    card: {
      shadowColor: "#000000",
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
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
