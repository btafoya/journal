import { PluginPermission, PluginStatus } from "@prisma/client";

/**
 * Plugin Manifest - defines plugin metadata and requirements
 * Based on research from VS Code, WordPress, and Obsidian plugin systems
 */
export interface PluginManifest {
  // Identity
  id: string; // Unique plugin identifier (e.g., "dark-mode-theme")
  name: string; // Human-readable name
  version: string; // Semantic version (e.g., "1.0.0")
  description: string;

  // Author information
  author: string;
  authorEmail?: string;
  authorUrl?: string;
  homepage?: string;
  repository?: string;

  // Requirements
  minAppVersion: string; // Minimum OpenJournal version
  license?: string; // Default: MIT

  // Permissions required
  permissions: PluginPermission[];

  // Entry point
  main: string; // Path to main plugin file (e.g., "index.js")

  // Lifecycle hooks (optional)
  hooks?: {
    onActivate?: string; // Path to activation handler
    onDeactivate?: string; // Path to deactivation handler
    onInstall?: string; // Path to installation handler
    onUninstall?: string; // Path to uninstallation handler
  };

  // Plugin metadata
  category: PluginCategory;
  tags?: string[];
  icon?: string; // Path to plugin icon

  // Configuration schema (JSON Schema)
  configSchema?: Record<string, any>;
}

export type PluginCategory =
  | "theme" // Visual themes
  | "export" // Export formats
  | "widget" // UI widgets/components
  | "integration" // External service integrations
  | "automation" // Workflow automation
  | "analytics" // Data analytics
  | "other";

/**
 * Plugin Context - provided to plugins at runtime
 */
export interface PluginContext {
  // Plugin metadata
  plugin: {
    id: string;
    version: string;
    config: Record<string, any>;
  };

  // API access based on permissions
  api: PluginAPI;

  // Storage for plugin data
  storage: PluginStorageAPI;

  // Event system
  events: PluginEventAPI;

  // Logging
  log: PluginLogger;
}

/**
 * Plugin API - safe API surface for plugins
 */
export interface PluginAPI {
  // Entry operations (if permissions granted)
  entries?: {
    list: (filters?: EntryFilters) => Promise<EntryMetadata[]>;
    get: (id: string) => Promise<EntryData | null>;
    create: (data: CreateEntryData) => Promise<EntryData>;
    update: (id: string, data: UpdateEntryData) => Promise<EntryData>;
    delete: (id: string) => Promise<void>;
  };

  // User operations (if permissions granted)
  user?: {
    getCurrentUser: () => Promise<UserData>;
    getSettings: (key: string) => Promise<any>;
    setSettings: (key: string, value: any) => Promise<void>;
  };

  // UI operations (if permissions granted)
  ui?: {
    showNotification: (message: string, type?: "info" | "success" | "error") => void;
    showDialog: (options: DialogOptions) => Promise<DialogResult>;
    registerMenuItem: (menu: MenuItemConfig) => void;
    registerWidget: (widget: WidgetConfig) => void;
  };

  // Network operations (if permissions granted)
  network?: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
}

/**
 * Plugin Storage API - key-value storage per plugin
 */
export interface PluginStorageAPI {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
}

/**
 * Plugin Event API - pub/sub event system
 */
export interface PluginEventAPI {
  on: (event: PluginEvent, handler: EventHandler) => void;
  off: (event: PluginEvent, handler: EventHandler) => void;
  emit: (event: string, data: any) => void;
}

export type PluginEvent =
  | "entry:created"
  | "entry:updated"
  | "entry:deleted"
  | "plugin:activated"
  | "plugin:deactivated"
  | "user:login"
  | "user:logout";

export type EventHandler = (data: any) => void | Promise<void>;

/**
 * Plugin Logger - scoped logging for plugins
 */
export interface PluginLogger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

// API Data Types

export interface EntryMetadata {
  id: string;
  title: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntryData extends EntryMetadata {
  content: string;
  published: boolean;
}

export interface EntryFilters {
  published?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface CreateEntryData {
  title: string;
  content: string;
  published?: boolean;
}

export interface UpdateEntryData {
  title?: string;
  content?: string;
  published?: boolean;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string;
}

export interface DialogOptions {
  title: string;
  message: string;
  buttons?: string[];
}

export interface DialogResult {
  button: string;
}

export interface MenuItemConfig {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
}

export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ComponentType;
}

/**
 * Plugin Lifecycle States
 */
export type { PluginStatus };

/**
 * Installed Plugin Info
 */
export interface InstalledPluginInfo {
  id: string;
  pluginId: string;
  version: string;
  status: PluginStatus;
  permissions: string[];
  config: Record<string, any>;
  installedAt: Date;
  lastEnabled?: Date;
  lastDisabled?: Date;
  errorMessage?: string;
}
