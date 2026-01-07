export const WORKFLOW_TRANSITIONS: Record<string, string[]> = {
  "To Do": ["In Progress", "Done"],
  "In Progress": ["To Do", "In Review", "Done"],
  "In Review": ["In Progress", "Done"],
  Done: ["In Progress", "To Do"],
};
