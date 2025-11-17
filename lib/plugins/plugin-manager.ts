import { prisma } from "@/lib/prisma";
import { PluginPermission, PluginStatus } from "@prisma/client";
import {
  PluginManifest,
  PluginContext,
  InstalledPluginInfo,
  PluginAPI,
  PluginStorageAPI,
  PluginEventAPI,
  PluginLogger,
} from "./types";
import { EventEmitter } from "events";

/**
 * Plugin Manager - Core plugin system management
 * Handles installation, activation, deactivation, and lifecycle
 */
export class PluginManager {
  private static instance: PluginManager;
  private eventEmitter: EventEmitter;
  private activePlugins: Map<string, any>; // pluginId => plugin instance

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.activePlugins = new Map();
  }

  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Install a plugin for a user
   */
  async install(userId: string, manifest: PluginManifest, permissions: PluginPermission[]): Promise<string> {
    // Validate manifest
    this.validateManifest(manifest);

    // Check if plugin already installed
    const existing = await prisma.installedPlugin.findUnique({
      where: {
        userId_pluginId: {
          userId,
          pluginId: manifest.id,
        },
      },
    });

    if (existing) {
      throw new Error(`Plugin ${manifest.id} is already installed`);
    }

    // Create installation record
    const plugin = await prisma.installedPlugin.create({
      data: {
        userId,
        pluginId: manifest.id,
        version: manifest.version,
        status: "INACTIVE",
        permissions,
        config: {},
        installedAt: new Date(),
      },
    });

    // Run installation hook if defined
    if (manifest.hooks?.onInstall) {
      try {
        await this.runHook(plugin.id, manifest.hooks.onInstall, {});
      } catch (error) {
        console.error(`Plugin ${manifest.id} installation hook failed:`, error);
      }
    }

    return plugin.id;
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(userId: string, pluginId: string): Promise<void> {
    const plugin = await prisma.installedPlugin.findUnique({
      where: {
        userId_pluginId: {
          userId,
          pluginId,
        },
      },
    });

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Deactivate if active
    if (plugin.status === "ACTIVE") {
      await this.deactivate(userId, pluginId);
    }

    // Run uninstallation hook
    // Note: Would need to load manifest first in real implementation

    // Delete plugin data
    await prisma.installedPlugin.delete({
      where: { id: plugin.id },
    });
  }

  /**
   * Activate a plugin
   */
  async activate(userId: string, pluginId: string): Promise<void> {
    const plugin = await prisma.installedPlugin.findUnique({
      where: {
        userId_pluginId: {
          userId,
          pluginId,
        },
      },
    });

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status === "ACTIVE") {
      return; // Already active
    }

    try {
      // Create plugin context
      const context = this.createContext(plugin);

      // Load and initialize plugin
      // In a real implementation, this would load the plugin code
      // For MVP, we'll just update the status

      // Update status
      await prisma.installedPlugin.update({
        where: { id: plugin.id },
        data: {
          status: "ACTIVE",
          lastEnabled: new Date(),
          errorMessage: null,
        },
      });

      // Emit activation event
      this.eventEmitter.emit("plugin:activated", { pluginId, userId });
    } catch (error) {
      // Update status to error
      await prisma.installedPlugin.update({
        where: { id: plugin.id },
        data: {
          status: "ERROR",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(userId: string, pluginId: string): Promise<void> {
    const plugin = await prisma.installedPlugin.findUnique({
      where: {
        userId_pluginId: {
          userId,
          pluginId,
        },
      },
    });

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status !== "ACTIVE") {
      return; // Not active
    }

    // Run deactivation hook
    // Cleanup plugin instance

    await prisma.installedPlugin.update({
      where: { id: plugin.id },
      data: {
        status: "INACTIVE",
        lastDisabled: new Date(),
      },
    });

    // Remove from active plugins
    this.activePlugins.delete(pluginId);

    // Emit deactivation event
    this.eventEmitter.emit("plugin:deactivated", { pluginId, userId });
  }

  /**
   * List installed plugins for a user
   */
  async list(userId: string): Promise<InstalledPluginInfo[]> {
    const plugins = await prisma.installedPlugin.findMany({
      where: { userId },
      orderBy: { installedAt: "desc" },
    });

    return plugins.map((p) => ({
      id: p.id,
      pluginId: p.pluginId,
      version: p.version,
      status: p.status,
      permissions: p.permissions,
      config: (p.config as Record<string, any>) || {},
      installedAt: p.installedAt,
      lastEnabled: p.lastEnabled || undefined,
      lastDisabled: p.lastDisabled || undefined,
      errorMessage: p.errorMessage || undefined,
    }));
  }

  /**
   * Update plugin configuration
   */
  async updateConfig(userId: string, pluginId: string, config: Record<string, any>): Promise<void> {
    await prisma.installedPlugin.updateMany({
      where: {
        userId,
        pluginId,
      },
      data: {
        config,
      },
    });
  }

  /**
   * Create plugin context for runtime
   */
  private createContext(plugin: any): PluginContext {
    const api = this.createAPI(plugin);
    const storage = this.createStorage(plugin.id);
    const events = this.createEventAPI();
    const log = this.createLogger(plugin.pluginId);

    return {
      plugin: {
        id: plugin.pluginId,
        version: plugin.version,
        config: (plugin.config as Record<string, any>) || {},
      },
      api,
      storage,
      events,
      log,
    };
  }

  /**
   * Create plugin API based on permissions
   */
  private createAPI(plugin: any): PluginAPI {
    const permissions = plugin.permissions as string[];
    const api: PluginAPI = {};

    // Add entry operations if permitted
    if (
      permissions.includes("READ_ENTRIES") ||
      permissions.includes("WRITE_ENTRIES") ||
      permissions.includes("DELETE_ENTRIES")
    ) {
      api.entries = {
        list: async (filters) => {
          // Implementation would query entries
          return [];
        },
        get: async (id) => {
          // Implementation would fetch entry
          return null;
        },
        create: async (data) => {
          if (!permissions.includes("WRITE_ENTRIES")) {
            throw new Error("Permission denied: WRITE_ENTRIES required");
          }
          // Implementation would create entry
          throw new Error("Not implemented");
        },
        update: async (id, data) => {
          if (!permissions.includes("WRITE_ENTRIES")) {
            throw new Error("Permission denied: WRITE_ENTRIES required");
          }
          // Implementation would update entry
          throw new Error("Not implemented");
        },
        delete: async (id) => {
          if (!permissions.includes("DELETE_ENTRIES")) {
            throw new Error("Permission denied: DELETE_ENTRIES required");
          }
          // Implementation would delete entry
          throw new Error("Not implemented");
        },
      };
    }

    // Add UI operations if permitted
    if (permissions.includes("MODIFY_UI")) {
      api.ui = {
        showNotification: (message, type) => {
          console.log(`[Plugin] ${type || "info"}: ${message}`);
        },
        showDialog: async (options) => {
          // Would show dialog in UI
          return { button: "ok" };
        },
        registerMenuItem: (menu) => {
          // Would register menu item
        },
        registerWidget: (widget) => {
          // Would register widget
        },
      };
    }

    return api;
  }

  /**
   * Create plugin storage API
   */
  private createStorage(pluginId: string): PluginStorageAPI {
    return {
      get: async (key: string) => {
        const item = await prisma.pluginStorage.findUnique({
          where: {
            pluginId_key: {
              pluginId,
              key,
            },
          },
        });
        return item?.value;
      },

      set: async (key: string, value: any) => {
        await prisma.pluginStorage.upsert({
          where: {
            pluginId_key: {
              pluginId,
              key,
            },
          },
          create: {
            pluginId,
            key,
            value,
          },
          update: {
            value,
          },
        });
      },

      delete: async (key: string) => {
        await prisma.pluginStorage.deleteMany({
          where: {
            pluginId,
            key,
          },
        });
      },

      clear: async () => {
        await prisma.pluginStorage.deleteMany({
          where: { pluginId },
        });
      },

      keys: async () => {
        const items = await prisma.pluginStorage.findMany({
          where: { pluginId },
          select: { key: true },
        });
        return items.map((i) => i.key);
      },
    };
  }

  /**
   * Create plugin event API
   */
  private createEventAPI(): PluginEventAPI {
    return {
      on: (event, handler) => {
        this.eventEmitter.on(event, handler);
      },
      off: (event, handler) => {
        this.eventEmitter.off(event, handler);
      },
      emit: (event, data) => {
        this.eventEmitter.emit(event, data);
      },
    };
  }

  /**
   * Create plugin logger
   */
  private createLogger(pluginId: string): PluginLogger {
    return {
      info: (message, ...args) => console.log(`[Plugin:${pluginId}] INFO:`, message, ...args),
      warn: (message, ...args) => console.warn(`[Plugin:${pluginId}] WARN:`, message, ...args),
      error: (message, ...args) => console.error(`[Plugin:${pluginId}] ERROR:`, message, ...args),
      debug: (message, ...args) => console.debug(`[Plugin:${pluginId}] DEBUG:`, message, ...args),
    };
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error("Invalid manifest: id, name, and version are required");
    }

    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error("Invalid manifest: id must contain only lowercase letters, numbers, and hyphens");
    }

    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error("Invalid manifest: version must follow semantic versioning (e.g., 1.0.0)");
    }

    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      throw new Error("Invalid manifest: permissions must be an array");
    }
  }

  /**
   * Run a plugin hook
   */
  private async runHook(pluginId: string, hookPath: string, data: any): Promise<void> {
    // In a real implementation, this would load and execute the hook function
    // For MVP, we'll just log it
    console.log(`Running hook ${hookPath} for plugin ${pluginId}`);
  }
}

// Export singleton instance
export const pluginManager = PluginManager.getInstance();
