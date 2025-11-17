# Daily Journaling Prompts Plugin

A simple plugin that displays a random journaling prompt each day to inspire your writing.

## Features

- 🎲 Random daily prompts from a curated collection
- ⏰ Time-based display (morning, afternoon, evening, or always)
- ✏️ Add your own custom prompts
- 📊 Track how often you use prompts
- 💾 Persistent storage of prompt history

## Installation

This is an example plugin included with the Journal App. To install:

1. Navigate to Settings → Plugins
2. Click "Install from Examples"
3. Select "Daily Journaling Prompts"
4. Grant the requested permissions:
   - **MODIFY_UI**: To display the prompt widget
   - **READ_USER_DATA**: To personalize prompt timing

## Configuration

After installation, you can configure the plugin:

### Show Time
Choose when to display the daily prompt:
- **Morning** (5 AM - 12 PM)
- **Afternoon** (12 PM - 5 PM)
- **Evening** (5 PM - 10 PM)
- **Always** (show anytime)

### Custom Prompts
Add your own journaling prompts to supplement the default collection:

```json
{
  "customPrompts": [
    "What's the best thing that happened this week?",
    "Describe a recent dream you remember.",
    "What's a book that changed your perspective?"
  ]
}
```

## Default Prompts

The plugin includes 15 thoughtful prompts covering:
- Gratitude and appreciation
- Personal growth and learning
- Goals and aspirations
- Relationships and connections
- Self-reflection and mindfulness

## Technical Details

### Storage Usage

The plugin uses the following storage keys:

- `currentPrompt`: Today's prompt and metadata
- `stats`: Usage statistics

### Events Listened

- `entry:created`: Increments prompt usage counter

### UI Components

- `DailyPromptWidget`: Dashboard widget displaying the prompt

## Development

This plugin demonstrates:
- ✅ Manifest configuration with schema
- ✅ Lifecycle hooks (activate/deactivate)
- ✅ Permission-based API usage
- ✅ Storage API for persistence
- ✅ Event system integration
- ✅ UI widget registration
- ✅ Configuration schema

## License

MIT
