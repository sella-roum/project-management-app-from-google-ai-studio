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
| `CreateIssueModal` | `/modal?mode=issue` | Create issue modal |
| `IssueDrawer` | `/issue/[issueId]` | Mobile uses full-screen issue detail |

## Web routing + modal entry points (from `apps/web/src/App.tsx`)

**Routes**

- Public/init: `/welcome`, `/login`
- Authenticated: `/`, `/dashboards`, `/projects`, `/projects/:projectId`, `/search`, `/notifications`, `/profile`, `/help`

**IssueDrawer**

- Opens when `selectedIssue` is set by `onOpenIssue`.
- Current entry points: Home (recent + assigned lists), Search results, Notifications list, Project view tabs (Board + Backlog).

**SetupWizard**

- Auto-displays when `isLoggedIn === true`, `hasSetup !== "true"`, and the current route is not `/welcome` or `/login`.
- Triggered on any authenticated route until setup completes and writes `hasSetup`.

**CreateIssueModal**

- Global create button in the TopBar (available on authenticated routes).
- Project view Board tab “課題を追加” button opens with preselected status + project context.

## Mobile layout comparison (from `apps/mobile/app/_layout.tsx` + `apps/mobile/app/(tabs)/_layout.tsx`)

- Root stack: `(auth)` group, `(tabs)` group, `/project/[projectId]`, `/projects/[projectId]`, `/setup`, `/modal`.
- Tabs: home, projects, dashboards, search, notifications, profile, help.

## Mobile parity gaps / 未到達な導線

- **Issue detail drawer equivalent**: mobile uses a full-screen issue detail view instead of a drawer.
- **Create issue entry points**: mobile relies on a floating action button or per-screen actions instead of the web TopBar.
- **Create project entry point**: exposed from Projects tab only; no global action.
- **Setup flow condition**: Mobile redirects at `/` based on AsyncStorage (`appInitialized`, `isLoggedIn`, `hasSetup`) rather than showing an in-place wizard overlay on any authenticated route.

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

## 「モバイルでの同等導線」の定義

- Webで到達できる主要フロー（Issue詳細閲覧、Issue作成、Project作成、Setup導線）が、モバイルでも同じ画面起点か近い意味合いのタブ/導線で再現されること。
- 画面遷移が異なる場合でも、ユーザーが迷わず同等の成果に到達できる入口が存在すること（例: WebのTopBar作成ボタンに相当するグローバル導線）。
