/**
 * Daily Journaling Prompts Plugin
 * Displays a random prompt to inspire daily journaling
 */

const DEFAULT_PROMPTS = [
  "What are you grateful for today?",
  "What's something new you learned recently?",
  "Describe a moment that made you smile today.",
  "What's a challenge you're facing and how might you overcome it?",
  "What's one thing you'd like to accomplish this week?",
  "Write about someone who influenced you recently.",
  "What's something you're looking forward to?",
  "Reflect on a recent conversation that stood out to you.",
  "What's a habit you'd like to develop or change?",
  "Describe your ideal day from start to finish.",
  "What's something you've been procrastinating on?",
  "Write about a place that brings you peace.",
  "What's a skill you'd like to learn and why?",
  "Reflect on how you've grown in the past year.",
  "What's something kind you did for someone recently?"
];

export async function activate(context) {
  const { plugin, api, storage, events, log } = context;

  log.info("Daily Prompt plugin activating...");

  // Load configuration
  const config = plugin.config || {};
  const showTime = config.showTime || "morning";
  const customPrompts = config.customPrompts || [];

  // Combine default and custom prompts
  const allPrompts = [...DEFAULT_PROMPTS, ...customPrompts];

  // Get or generate today's prompt
  const todayPrompt = await getTodaysPrompt(storage, allPrompts);

  // Check if we should show the prompt now
  const shouldShow = shouldShowPrompt(showTime);

  if (shouldShow && api.ui) {
    // Register a widget to display the prompt
    api.ui.registerWidget({
      id: "daily-prompt-widget",
      position: "dashboard-top",
      component: "DailyPromptWidget",
      props: {
        prompt: todayPrompt,
        date: new Date().toLocaleDateString()
      }
    });

    log.info("Daily prompt widget registered");
  }

  // Listen for entry creation to track prompt usage
  if (events) {
    events.on("entry:created", async (data) => {
      const stats = await storage.get("stats") || { promptsUsed: 0 };
      stats.promptsUsed += 1;
      await storage.set("stats", stats);
      log.debug(`Prompt used count: ${stats.promptsUsed}`);
    });
  }

  log.info("Daily Prompt plugin activated successfully");
}

export async function deactivate(context) {
  const { log } = context;
  log.info("Daily Prompt plugin deactivated");
}

/**
 * Get today's prompt from storage or generate a new one
 */
async function getTodaysPrompt(storage, prompts) {
  const today = new Date().toDateString();
  const stored = await storage.get("currentPrompt");

  // Check if we have a prompt for today
  if (stored && stored.date === today) {
    return stored.prompt;
  }

  // Generate new prompt for today
  const randomIndex = Math.floor(Math.random() * prompts.length);
  const newPrompt = {
    date: today,
    prompt: prompts[randomIndex],
    index: randomIndex
  };

  await storage.set("currentPrompt", newPrompt);
  return newPrompt.prompt;
}

/**
 * Determine if prompt should be shown based on time setting
 */
function shouldShowPrompt(showTime) {
  if (showTime === "always") return true;

  const hour = new Date().getHours();

  switch (showTime) {
    case "morning":
      return hour >= 5 && hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 17;
    case "evening":
      return hour >= 17 && hour < 22;
    default:
      return true;
  }
}
