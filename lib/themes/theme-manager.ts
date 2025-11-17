import { prisma } from "@/lib/prisma";
import { ThemeStatus } from "@prisma/client";
import {
  type ThemeManifest,
  type InstalledThemeInfo,
  type ThemeValidationResult,
  type ThemeCompatibilityCheck,
  validateThemeManifest,
} from "./types";

/**
 * Theme Manager - Core theme system management
 * Handles installation, activation, deactivation, and lifecycle
 */
export class ThemeManager {
  private static instance: ThemeManager;

  private constructor() {}

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Install a theme for a user
   */
  async install(userId: string, manifest: ThemeManifest, config?: Record<string, any>): Promise<string> {
    // Validate manifest
    const validation = this.validateTheme(manifest);
    if (!validation.valid) {
      throw new Error(`Theme validation failed: ${validation.errors.join(", ")}`);
    }

    // Check if theme already installed
    const existing = await prisma.installedTheme.findUnique({
      where: {
        userId_themeId: {
          userId,
          themeId: manifest.id,
        },
      },
    });

    if (existing) {
      throw new Error(`Theme ${manifest.id} is already installed`);
    }

    // Create installation record
    const theme = await prisma.installedTheme.create({
      data: {
        userId,
        themeId: manifest.id,
        version: manifest.version,
        status: "INACTIVE",
        isActive: false,
        config: config || {},
        installedAt: new Date(),
      },
    });

    return theme.id;
  }

  /**
   * Uninstall a theme
   */
  async uninstall(userId: string, themeId: string): Promise<void> {
    const theme = await prisma.installedTheme.findUnique({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
    });

    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    // Don't allow uninstalling the active theme
    if (theme.isActive) {
      throw new Error("Cannot uninstall the currently active theme. Please activate another theme first.");
    }

    // Delete theme
    await prisma.installedTheme.delete({
      where: { id: theme.id },
    });
  }

  /**
   * Activate a theme (set as active for user)
   */
  async activate(userId: string, themeId: string): Promise<void> {
    const theme = await prisma.installedTheme.findUnique({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
    });

    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    try {
      // Deactivate all other themes for this user
      await prisma.installedTheme.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          status: "INACTIVE",
        },
      });

      // Activate the selected theme
      await prisma.installedTheme.update({
        where: { id: theme.id },
        data: {
          isActive: true,
          status: "ACTIVE",
          lastEnabled: new Date(),
        },
      });

      // Update user's preferred theme
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferredTheme: themeId,
        },
      });
    } catch (error) {
      // Update status to error
      await prisma.installedTheme.update({
        where: { id: theme.id },
        data: {
          status: "ERROR",
        },
      });

      throw error;
    }
  }

  /**
   * Deactivate a theme
   */
  async deactivate(userId: string, themeId: string): Promise<void> {
    const theme = await prisma.installedTheme.findUnique({
      where: {
        userId_themeId: {
          userId,
          themeId,
        },
      },
    });

    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    if (!theme.isActive) {
      return; // Already inactive
    }

    await prisma.installedTheme.update({
      where: { id: theme.id },
      data: {
        isActive: false,
        status: "INACTIVE",
      },
    });

    // Clear user's preferred theme if this was it
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredTheme: true },
    });

    if (user?.preferredTheme === themeId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferredTheme: null,
        },
      });
    }
  }

  /**
   * List installed themes for a user
   */
  async list(userId: string): Promise<InstalledThemeInfo[]> {
    const themes = await prisma.installedTheme.findMany({
      where: { userId },
      orderBy: { installedAt: "desc" },
    });

    return themes.map((t) => ({
      id: t.id,
      themeId: t.themeId,
      version: t.version,
      status: t.status,
      isActive: t.isActive,
      config: (t.config as Record<string, any>) || {},
      installedAt: t.installedAt,
      lastEnabled: t.lastEnabled || undefined,
    }));
  }

  /**
   * Get the active theme for a user
   */
  async getActiveTheme(userId: string): Promise<InstalledThemeInfo | null> {
    const theme = await prisma.installedTheme.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!theme) {
      return null;
    }

    return {
      id: theme.id,
      themeId: theme.themeId,
      version: theme.version,
      status: theme.status,
      isActive: theme.isActive,
      config: (theme.config as Record<string, any>) || {},
      installedAt: theme.installedAt,
      lastEnabled: theme.lastEnabled || undefined,
    };
  }

  /**
   * Update theme configuration
   */
  async updateConfig(userId: string, themeId: string, config: Record<string, any>): Promise<void> {
    await prisma.installedTheme.updateMany({
      where: {
        userId,
        themeId,
      },
      data: {
        config,
      },
    });
  }

  /**
   * Validate theme manifest
   */
  validateTheme(manifest: ThemeManifest): ThemeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate with Zod schema
      validateThemeManifest(manifest);

      // Additional validation
      if (!manifest.name || manifest.name.length < 3) {
        errors.push("Theme name must be at least 3 characters");
      }

      if (!manifest.id || !/^[a-z0-9-]+$/.test(manifest.id)) {
        errors.push("Theme ID must contain only lowercase letters, numbers, and hyphens");
      }

      if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        errors.push("Invalid version format. Use semantic versioning (e.g., 1.0.0)");
      }

      // Check for required colors
      const requiredColors = [
        "background",
        "foreground",
        "primary",
        "primary-foreground",
      ];

      const missingColors = requiredColors.filter(
        (color) => !manifest.colors[color as keyof typeof manifest.colors]
      );

      if (missingColors.length > 0) {
        errors.push(`Missing required colors: ${missingColors.join(", ")}`);
      }

      // Color contrast warnings (simplified)
      const contrastIssues = this.checkBasicContrast(manifest.colors);
      if (contrastIssues.length > 0) {
        warnings.push(...contrastIssues);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : "Validation failed"],
        warnings: [],
      };
    }
  }

  /**
   * Check theme compatibility
   */
  checkCompatibility(manifest: ThemeManifest, appVersion: string): ThemeCompatibilityCheck {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Version compatibility
    if (manifest.minAppVersion) {
      const compatible = this.compareVersions(appVersion, manifest.minAppVersion) >= 0;
      if (!compatible) {
        issues.push(
          `Theme requires app version ${manifest.minAppVersion} or higher (current: ${appVersion})`
        );
      }
    }

    // Check if compatibleWith is specified
    if (manifest.compatibleWith && manifest.compatibleWith.length > 0) {
      const isCompatible = manifest.compatibleWith.some((version) => {
        // Simple version range check (supports "1.x", "2.x", etc.)
        if (version.endsWith(".x")) {
          const major = version.split(".")[0];
          return appVersion.startsWith(major);
        }
        return version === appVersion;
      });

      if (!isCompatible) {
        issues.push(
          `Theme is designed for versions: ${manifest.compatibleWith.join(", ")}`
        );
      }
    }

    // Check for OKLCH color usage (modern browsers only)
    const usesOklch = Object.values(manifest.colors).some((color) =>
      color.includes("oklch")
    );

    if (usesOklch) {
      recommendations.push(
        "Theme uses OKLCH colors. Ensure browser support or provide fallbacks."
      );
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    return 0;
  }

  /**
   * Basic contrast checking (simplified)
   */
  private checkBasicContrast(colors: Record<string, string>): string[] {
    const warnings: string[] = [];

    // This is a very simplified check
    // In a real implementation, you'd use a proper color contrast library
    const pairings = [
      ["background", "foreground"],
      ["primary", "primary-foreground"],
      ["secondary", "secondary-foreground"],
      ["card", "card-foreground"],
    ];

    for (const [bg, fg] of pairings) {
      const bgColor = colors[bg];
      const fgColor = colors[fg];

      if (bgColor && fgColor) {
        // Very basic check - if both are hsl and have similar lightness, warn
        if (bgColor.includes("hsl") && fgColor.includes("hsl")) {
          const bgLightness = this.extractHslLightness(bgColor);
          const fgLightness = this.extractHslLightness(fgColor);

          if (Math.abs(bgLightness - fgLightness) < 30) {
            warnings.push(
              `Low contrast between ${bg} and ${fg}. Consider adjusting for better readability.`
            );
          }
        }
      }
    }

    return warnings;
  }

  /**
   * Extract lightness value from HSL color string
   */
  private extractHslLightness(hsl: string): number {
    const match = hsl.match(/hsl\([^,]+,[^,]+,\s*(\d+)%?\)/);
    return match ? parseInt(match[1], 10) : 50;
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
