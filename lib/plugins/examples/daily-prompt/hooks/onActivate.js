/**
 * Plugin activation hook
 * Called when the plugin is first activated
 */

export default async function onActivate(context) {
  const { storage, log, api } = context;

  log.info("Running activation hook for Daily Prompt plugin");

  // Initialize storage with default values
  await storage.set("stats", {
    promptsUsed: 0,
    activatedAt: new Date().toISOString(),
    totalActivations: ((await storage.get("stats"))?.totalActivations || 0) + 1
  });

  // Show welcome notification
  if (api.ui) {
    api.ui.showNotification(
      "Daily Prompt plugin activated! You'll see a new journaling prompt each day.",
      "success"
    );
  }

  log.info("Activation hook completed successfully");
}
