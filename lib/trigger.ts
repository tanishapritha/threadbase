import { TriggerClient } from "@trigger.dev/sdk";

export const triggerClient = new TriggerClient({
  id: "threadbase",
  apiKey: process.env.TRIGGER_API_KEY!,
});
