# Feature parity checklist (Web → Mobile)

## Routing parity

| Web route | Mobile route | Notes |
| --- | --- | --- |
| `/welcome` | `/(auth)/welcome` | Demo/fresh start entry point |
| `/login` | `/(auth)/login` | Storage-backed login/registration |
| `SetupWizard` modal | `/setup` | Initial project creation flow |
| `/` (Home) | `/(tabs)/home` | Overview + quick actions |
| `/projects` | `/(tabs)/projects` | List + create + star toggle |
| `/projects/:projectId` | `/project/[projectId]` | Summary/Board/Backlog/Timeline/Releases/Automation/Settings tabs |
| `/search` | `/(tabs)/search` | JQL + saved filters |
| `/notifications` | `/(tabs)/notifications` | Notifications list + mark all read |
| `/profile` | `/(tabs)/profile` | Profile edit + stats + reset |
| `/help` | `/(tabs)/help` | Help Center entry |
| `/dashboards` | `/(tabs)/dashboards` | Dashboards entry |
| `IssueDrawer` | `/modal?mode=issue` | Create issue modal |

## Data parity expectations

| Capability | Web (Dexie) | Mobile (SQLite) |
| --- | --- | --- |
| Saved filters | `savedFilters` table | `saved_filters` table |
| Versions | `projectVersions` table | `versions` table |
| Recent issues | `viewHistory` table | `view_history` table |
| Automation rules/logs | `automationRules` / `automationLogs` | `automation_rules` / `automation_logs` |
| Setup state | `localStorage` keys | `AsyncStorage` keys |

## Seed + setup flow

1. Welcome screen sets `appInitialized` + `hasSetup` (demo) or clears `hasSetup` (fresh).
2. Login persists `isLoggedIn` and uses storage adapters to register/login users.
3. If `hasSetup` is missing, Mobile redirects to `/setup` to create initial project.
