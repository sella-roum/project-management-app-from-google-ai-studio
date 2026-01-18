# Web ⇄ Mobile 差分一覧（画面/機能/導線）

`docs/feature_parity.md` を確認し、差分を「画面・機能・導線」の3軸で整理した一覧です。
差分は理由（制約・未実装・設計差）を併記しています。

| 軸 | Web | Mobile | 差分 | 理由 |
| --- | --- | --- | --- | --- |
| 画面 | `/dashboards` | `/(tabs)/dashboards` | Mobileはプレースホルダのみ | 画面未実装（ダッシュボード構成/ガジェット未移植） |
| 画面 | `/projects/:projectId` (Summary/Board/Backlog/Timeline/Releases/Automation/Settings) | `/project/[projectId]` | Mobileは簡易タブ + 1画面構成 | 各タブの詳細UI/操作が未移植 |
| 画面 | `IssueDrawer` (モーダル) | `/issue/[issueId]` (フルスクリーン) | 表示方式が異なる | モバイルでのレイアウト最適化（Drawer相当をフルスクリーン化） |
| 機能 | グローバル課題作成 (TopBar) | 画面内FAB/画面内ボタン | 入口が異なる | ナビゲーション構成の違い（TopBar非搭載） |
| 機能 | Project作成 (TopBarなど) | Projectsタブのみ | グローバル作成導線が不足 | モバイルのタブ導線に限定 |
| 機能 | 通知の既読管理/個別操作 | 画面表示で一括既読 | 操作粒度が不足 | 既読管理UI未実装 |
| 機能 | SetupWizardは任意画面で自動表示 | `/setup` へのリダイレクト | 体験が異なる | Mobileはリダイレクト方式を採用 |
| 導線 | Homeの課題詳細遷移 (複数リスト) | Homeの情報が簡略 | 遷移入口が不足 | Home画面情報量が不足 |
| 導線 | Searchの保存フィルタ/高度UI | 簡易リスト | 機能入口が不足 | Search画面のUIが簡略 |
| 導線 | Help Center (カード/CTA) | テキスト中心 | 案内の導線が弱い | UI未整備 |

