/**
 * Plugin deactivation hook
 * Called when the plugin is deactivated
 */

export default async function onDeactivate(context) {
  const { storage, log, api } = context;

  log.info("Running deactivation hook for Daily Prompt plugin");

  // Get final stats before deactivation
  const stats = await storage.get("stats");

  if (stats) {
    log.info(`Plugin was used ${stats.promptsUsed} times since activation`);
  }

  // Show goodbye notification
  if (api.ui) {
    api.ui.showNotification(
      "Daily Prompt plugin deactivated. Your prompts and stats are saved.",
      "info"
    );
  }

  log.info("Deactivation hook completed successfully");
}
