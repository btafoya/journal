import { z } from "zod";

/**
 * Color value schema - supports hex, hsl, and oklch
 */
const colorSchema = z.string().regex(
  /^(#[0-9A-Fa-f]{6}|hsl\(.+\)|oklch\(.+\))$/,
  "Color must be a valid hex (#RRGGBB), hsl(), or oklch() value"
);

/**
 * Theme colors schema matching shadcn/ui convention
 */
const themeColorsSchema = z.object({
  background: colorSchema,
  foreground: colorSchema,
  card: colorSchema,
  "card-foreground": colorSchema,
  popover: colorSchema,
  "popover-foreground": colorSchema,
  primary: colorSchema,
  "primary-foreground": colorSchema,
  secondary: colorSchema,
  "secondary-foreground": colorSchema,
  muted: colorSchema,
  "muted-foreground": colorSchema,
  accent: colorSchema,
  "accent-foreground": colorSchema,
  destructive: colorSchema,
  "destructive-foreground": colorSchema,
  border: colorSchema,
  input: colorSchema,
  ring: colorSchema,
});

/**
 * Typography configuration schema
 */
const typographySchema = z.object({
  fontFamily: z.string(),
  headingFamily: z.string().optional(),
  fontSize: z.record(z.string()).optional(),
});

/**
 * Theme manifest schema
 */
export const themeManifestSchema = z.object({
  // Metadata
  id: z.string().regex(/^[a-z0-9-]+$/, "Theme ID must contain only lowercase letters, numbers, and hyphens"),
  name: z.string().min(3, "Theme name must be at least 3 characters"),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must follow semantic versioning (e.g., 1.0.0)"),
  description: z.string().optional(),
  author: z.string(),
  authorEmail: z.string().email().optional(),
  authorUrl: z.string().url().optional(),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),

  // Theme configuration
  colors: themeColorsSchema,
  typography: typographySchema.optional(),
  spacing: z.record(z.string()).optional(),
  radius: z.string().optional(),

  // Metadata
  category: z.enum(["light", "dark", "colorful", "minimal", "professional", "creative", "other"]),
  tags: z.array(z.string()).optional(),

  // License
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),

  // Compatibility
  compatibleWith: z.array(z.string()).optional(),
});

export type ThemeManifest = z.infer<typeof themeManifestSchema>;
export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeTypography = z.infer<typeof typographySchema>;

/**
 * Installed theme info
 */
export interface InstalledThemeInfo {
  id: string;
  themeId: string;
  version: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
  isActive: boolean;
  config?: Record<string, any>;
  installedAt: Date;
  lastEnabled?: Date;
}

/**
 * Theme registry info (marketplace)
 */
export interface ThemeRegistryInfo {
  id: string;
  themeId: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: string;
  tags: string[];
  previewUrl?: string;
  downloadCount: number;
  activeInstalls: number;
  rating?: number;
  verified: boolean;
  featured: boolean;
  colors: ThemeColors;
  typography?: ThemeTypography;
  radius?: string;
}

/**
 * Theme category enum
 */
export type ThemeCategory =
  | "light"
  | "dark"
  | "colorful"
  | "minimal"
  | "professional"
  | "creative"
  | "other";

/**
 * Theme status enum
 */
export type ThemeStatus = "ACTIVE" | "INACTIVE" | "ERROR";

/**
 * Validation result
 */
export interface ThemeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Compatibility check result
 */
export interface ThemeCompatibilityCheck {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
}

/**
 * Theme filters for marketplace search
 */
export interface ThemeFilters {
  category?: ThemeCategory[];
  tags?: string[];
  minRating?: number;
  author?: string;
  verified?: boolean;
  featured?: boolean;
  sortBy?: "downloads" | "rating" | "recent" | "name";
}

/**
 * Validate a theme manifest
 */
export function validateThemeManifest(data: unknown): ThemeManifest {
  return themeManifestSchema.parse(data);
}

/**
 * Check if a value is a valid theme manifest
 */
export function isValidThemeManifest(data: unknown): data is ThemeManifest {
  return themeManifestSchema.safeParse(data).success;
}
