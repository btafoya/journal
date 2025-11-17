# Plugin Development Guide

## Overview

The Journal App plugin system allows you to extend the application with custom functionality while maintaining security and isolation. Plugins can add new UI components, process journal entries, integrate with external services, and more.

## Table of Contents

- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Plugin Manifest](#plugin-manifest)
- [Plugin API](#plugin-api)
- [Permissions](#permissions)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Storage API](#storage-api)
- [Event System](#event-system)
- [UI Integration](#ui-integration)
- [Best Practices](#best-practices)
- [Publishing](#publishing)

## Architecture

### Core Components

1. **Plugin Manager**: Handles installation, activation, and lifecycle management
2. **Permission System**: Granular access control for plugin capabilities
3. **Storage Layer**: Isolated key-value storage per plugin
4. **Event System**: Pub/sub for plugin communication and app events
5. **Context API**: Sandboxed environment with permission-based access

### Plugin Structure

```
my-plugin/
├── manifest.json          # Plugin metadata and configuration
├── index.js              # Main entry point
├── hooks/                # Lifecycle hooks (optional)
│   ├── onActivate.js
│   ├── onDeactivate.js
│   ├── onInstall.js
│   └── onUninstall.js
├── components/           # UI components (optional)
├── utils/                # Helper functions (optional)
└── README.md             # Documentation
```

## Getting Started

### 1. Create Plugin Directory

```bash
mkdir -p lib/plugins/my-plugin
cd lib/plugins/my-plugin
```

### 2. Create Manifest

Create `manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "A plugin that does amazing things",
  "author": "Your Name",
  "minAppVersion": "1.0.0",
  "permissions": [
    "READ_ENTRIES",
    "MODIFY_UI"
  ],
  "main": "index.js",
  "category": "productivity",
  "tags": ["automation", "export"]
}
```

### 3. Create Main Entry Point

Create `index.js`:

```javascript
export async function activate(context) {
  const { plugin, api, storage, events, log } = context;

  log.info(`${plugin.id} v${plugin.version} activating...`);

  // Your plugin logic here

  log.info("Plugin activated successfully");
}

export async function deactivate(context) {
  const { log } = context;
  log.info("Plugin deactivated");
}
```

## Plugin Manifest

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase, hyphens only) |
| `name` | string | Display name |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `description` | string | Brief description |
| `author` | string | Author name or organization |
| `minAppVersion` | string | Minimum compatible app version |
| `permissions` | string[] | Required permissions |
| `main` | string | Entry point file |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `hooks` | object | Lifecycle hook paths |
| `category` | string | Plugin category |
| `tags` | string[] | Searchable tags |
| `configSchema` | object | Configuration schema |
| `icon` | string | Plugin icon path |
| `repository` | string | Source code URL |
| `license` | string | License type |

### Configuration Schema

Define user-configurable options:

```json
{
  "configSchema": {
    "apiKey": {
      "type": "string",
      "description": "API key for external service",
      "required": true,
      "secret": true
    },
    "interval": {
      "type": "number",
      "default": 60,
      "min": 10,
      "max": 3600,
      "description": "Sync interval in seconds"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "Enable automatic sync"
    }
  }
}
```

## Plugin API

### Context Object

The plugin context provides access to app functionality:

```typescript
interface PluginContext {
  plugin: {
    id: string;
    version: string;
    config: Record<string, any>;
  };
  api: PluginAPI;
  storage: PluginStorageAPI;
  events: PluginEventAPI;
  log: PluginLogger;
}
```

### Entries API

Requires: `READ_ENTRIES`, `WRITE_ENTRIES`, or `DELETE_ENTRIES`

```javascript
// List entries with filters
const entries = await api.entries.list({
  limit: 10,
  offset: 0,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  tags: ['work']
});

// Get single entry
const entry = await api.entries.get('entry-id');

// Create new entry
const newEntry = await api.entries.create({
  title: 'New Entry',
  content: 'Entry content',
  tags: ['plugin-generated']
});

// Update entry
await api.entries.update('entry-id', {
  content: 'Updated content'
});

// Delete entry
await api.entries.delete('entry-id');
```

### User API

Requires: `READ_USER_DATA`

```javascript
// Get current user info
const user = await api.user.getCurrentUser();

// Get user settings
const theme = await api.user.getSettings('theme');

// Update user settings
await api.user.setSettings('theme', 'dark');
```

### UI API

Requires: `MODIFY_UI`

```javascript
// Show notification
api.ui.showNotification('Operation completed', 'success');

// Show dialog
const result = await api.ui.showDialog({
  title: 'Confirm Action',
  message: 'Are you sure?',
  buttons: ['Cancel', 'Confirm']
});

// Register menu item
api.ui.registerMenuItem({
  id: 'my-plugin-action',
  label: 'Custom Action',
  position: 'entry-menu',
  icon: 'star',
  onClick: async () => {
    // Handle click
  }
});

// Register widget
api.ui.registerWidget({
  id: 'my-widget',
  position: 'dashboard-top',
  component: 'MyWidgetComponent',
  props: { /* widget props */ }
});
```

### Network API

Requires: `NETWORK_ACCESS`

```javascript
// Make HTTP requests
const response = await api.network.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});

const data = await response.json();
```

## Permissions

### Available Permissions

| Permission | Description |
|------------|-------------|
| `READ_ENTRIES` | Read journal entries |
| `WRITE_ENTRIES` | Create and update entries |
| `DELETE_ENTRIES` | Delete entries |
| `READ_USER_DATA` | Access user profile and settings |
| `MANAGE_FILES` | Upload and manage file attachments |
| `NETWORK_ACCESS` | Make external HTTP requests |
| `DATABASE_ACCESS` | Direct database access (restricted) |
| `EXECUTE_SCRIPTS` | Run custom scripts |
| `MODIFY_UI` | Add UI components and widgets |
| `ACCESS_SETTINGS` | Read and write app settings |

### Permission Best Practices

1. **Request minimum permissions** needed for functionality
2. **Document why** each permission is required
3. **Handle permission denial** gracefully
4. **Avoid sensitive operations** without user confirmation

## Lifecycle Hooks

### onInstall

Called when plugin is first installed:

```javascript
// hooks/onInstall.js
export default async function onInstall(context) {
  const { storage, log } = context;

  // Initialize default configuration
  await storage.set('config', {
    firstRun: true,
    installDate: new Date().toISOString()
  });

  log.info('Plugin installed successfully');
}
```

### onActivate

Called when plugin is activated:

```javascript
// hooks/onActivate.js
export default async function onActivate(context) {
  const { storage, api, log } = context;

  // Set up initial state
  await storage.set('lastActivated', new Date().toISOString());

  // Show welcome message
  if (api.ui) {
    api.ui.showNotification('Plugin activated!', 'success');
  }

  log.info('Plugin activated');
}
```

### onDeactivate

Called when plugin is deactivated:

```javascript
// hooks/onDeactivate.js
export default async function onDeactivate(context) {
  const { storage, log } = context;

  // Clean up temporary data
  const stats = await storage.get('stats');
  log.info(`Plugin used ${stats.count} times`);

  log.info('Plugin deactivated');
}
```

### onUninstall

Called before plugin is uninstalled:

```javascript
// hooks/onUninstall.js
export default async function onUninstall(context) {
  const { storage, log } = context;

  // Optional: Export user data before deletion
  const userData = await storage.get('userData');
  if (userData) {
    log.info('Backing up user data before uninstall');
    // Export logic here
  }

  log.info('Plugin uninstalled');
}
```

## Storage API

Each plugin has isolated key-value storage:

```javascript
// Store data
await storage.set('myKey', { foo: 'bar', count: 42 });

// Retrieve data
const data = await storage.get('myKey');

// Delete data
await storage.delete('myKey');

// Clear all plugin data
await storage.clear();

// List all keys
const keys = await storage.keys();
```

### Storage Best Practices

1. **Namespace your keys**: Use prefixes like `cache:`, `settings:`, `data:`
2. **Clean up unused data**: Remove temporary data in `onDeactivate`
3. **Handle missing data**: Always check if key exists
4. **Encrypt sensitive data**: Mark as encrypted in schema

## Event System

### Listening to Events

```javascript
// Listen for entry creation
events.on('entry:created', async (entry) => {
  log.info(`New entry created: ${entry.id}`);
  // Handle the event
});

// Listen for entry updates
events.on('entry:updated', async (entry) => {
  log.info(`Entry updated: ${entry.id}`);
});

// Listen for entry deletion
events.on('entry:deleted', async (entryId) => {
  log.info(`Entry deleted: ${entryId}`);
});
```

### Emitting Custom Events

```javascript
// Emit custom events for plugin communication
events.emit('my-plugin:action-completed', {
  timestamp: Date.now(),
  data: { /* event data */ }
});

// Other plugins can listen
events.on('my-plugin:action-completed', (data) => {
  // Handle event from another plugin
});
```

### Available System Events

- `entry:created` - New journal entry created
- `entry:updated` - Entry modified
- `entry:deleted` - Entry removed
- `entry:tagged` - Tags added to entry
- `user:settings-changed` - User settings modified
- `plugin:activated` - Plugin was activated
- `plugin:deactivated` - Plugin was deactivated

### Event Cleanup

Always remove event listeners in `deactivate`:

```javascript
let entryHandler;

export async function activate(context) {
  entryHandler = (entry) => {
    // Handle entry creation
  };
  context.events.on('entry:created', entryHandler);
}

export async function deactivate(context) {
  context.events.off('entry:created', entryHandler);
}
```

## UI Integration

### Widget System

Register widgets for different positions:

```javascript
api.ui.registerWidget({
  id: 'stats-widget',
  position: 'dashboard-top',    // dashboard-top, dashboard-bottom, sidebar
  component: 'StatsWidget',
  props: {
    refreshInterval: 60000
  }
});
```

### Menu Items

Add custom menu actions:

```javascript
api.ui.registerMenuItem({
  id: 'export-action',
  label: 'Export to PDF',
  position: 'entry-menu',       // entry-menu, main-menu, settings-menu
  icon: 'download',
  onClick: async (context) => {
    // Handle menu click
  },
  enabled: (context) => {
    // Return true if menu item should be enabled
    return context.entry !== null;
  }
});
```

## Best Practices

### Security

1. **Validate all input**: Never trust user-provided data
2. **Sanitize output**: Prevent XSS in UI components
3. **Use HTTPS**: For all external API calls
4. **Store secrets securely**: Mark sensitive config as `secret: true`
5. **Handle errors**: Don't expose internal errors to users

### Performance

1. **Debounce frequent operations**: Especially event handlers
2. **Cache expensive computations**: Use storage for caching
3. **Lazy load resources**: Load only what's needed
4. **Clean up timers**: Clear intervals/timeouts in deactivate
5. **Batch API calls**: Reduce number of requests

### User Experience

1. **Provide clear feedback**: Use notifications and loading states
2. **Handle failures gracefully**: Show helpful error messages
3. **Document configuration**: Explain all settings clearly
4. **Support dark mode**: Respect user theme preference
5. **Be accessible**: Follow ARIA guidelines for UI

### Code Quality

1. **Use semantic versioning**: Follow semver for versions
2. **Write tests**: Test core functionality
3. **Document your code**: Add JSDoc comments
4. **Follow conventions**: Match app coding style
5. **Handle edge cases**: Test with various scenarios

## Publishing

### Preparation Checklist

- [ ] Manifest complete with all required fields
- [ ] README with installation and usage instructions
- [ ] LICENSE file included
- [ ] Example configuration provided
- [ ] Permissions documented and justified
- [ ] Code tested with latest app version
- [ ] No hardcoded secrets or API keys
- [ ] Screenshots or demo available

### Submission Process

1. **Package your plugin**:
   ```bash
   tar -czf my-plugin-1.0.0.tar.gz my-plugin/
   ```

2. **Calculate checksum**:
   ```bash
   sha256sum my-plugin-1.0.0.tar.gz
   ```

3. **Submit to marketplace**:
   - Upload package file
   - Provide checksum
   - Fill out metadata
   - Request verification (optional)

### Versioning Guidelines

- **Major (1.0.0 → 2.0.0)**: Breaking changes, incompatible API changes
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes, backward compatible

## Examples

See `lib/plugins/examples/` for complete working examples:

- **daily-prompt**: Displays random journaling prompts
- **export-pdf**: Export entries to PDF format (coming soon)
- **mood-tracker**: Track and visualize mood over time (coming soon)
- **sync-google-drive**: Sync with Google Drive (coming soon)

## Support

- **Documentation**: https://docs.journalapp.com/plugins
- **Discord**: https://discord.gg/journalapp
- **GitHub Issues**: https://github.com/journalapp/plugins
- **Email**: plugins@journalapp.com

## License

Plugin development is supported under the MIT License.
