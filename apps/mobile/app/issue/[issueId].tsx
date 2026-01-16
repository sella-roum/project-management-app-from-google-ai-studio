import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Share,
} from "react-native";
import * as Linking from "expo-linking";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";

import type {
  Issue,
  IssuePriority,
  IssueStatus,
  IssueType,
  Project,
  Version,
} from "@repo/core";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
} from "@repo/core";
import {
  USERS,
  addAttachment,
  addComment,
  addIssueLink,
  createIssue,
  deleteIssue,
  getCurrentUserId,
  getIssueById,
  getIssues,
  getProjectById,
  getSubtasks,
  getVersions,
  logWork,
  recordView,
  toggleWatch,
  updateIssue,
  updateIssueStatus,
} from "@repo/storage";

import { EmptyState } from "@/components/empty-state";
import { SelectionSheet } from "@/components/selection-sheet";
import { Skeleton } from "@/components/skeleton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function IssueDetailScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const { issueId } = useLocalSearchParams<{ issueId: string }>();
  const normalizedIssueId = useMemo(
    () => (Array.isArray(issueId) ? issueId[0] : issueId),
    [issueId],
  );
  const [issue, setIssue] = useState<Issue | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [subtasks, setSubtasks] = useState<Issue[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [worklogMinutes, setWorklogMinutes] = useState("");
  const [worklogComment, setWorklogComment] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedLinkType, setSelectedLinkType] = useState<
    "blocks" | "is blocked by" | "relates to"
  >("relates to");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUri, setAttachmentUri] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [activeSheet, setActiveSheet] = useState<
    "status" | "priority" | "assignee" | null
  >(null);
  const commentInputRef = useRef<TextInput | null>(null);

  const currentUserId = getCurrentUserId();

  const reload = useCallback(async () => {
    if (!normalizedIssueId) return;
    const issueData = await getIssueById(normalizedIssueId);
    setIssue(issueData);
    if (issueData) {
      setTitle(issueData.title);
      setDescription(issueData.description ?? "");
      setStoryPoints(
        issueData.storyPoints !== undefined ? String(issueData.storyPoints) : "",
      );
      setDueDate(issueData.dueDate ? issueData.dueDate.slice(0, 10) : "");
      const [projectData, versionData, subtaskData] = await Promise.all([
        getProjectById(issueData.projectId),
        getVersions(issueData.projectId),
        getSubtasks(issueData.id),
      ]);
      setProject(projectData);
      setVersions(versionData);
      setSubtasks(subtaskData);
      void recordView(issueData.id);
    } else {
      setProject(null);
      setVersions([]);
      setSubtasks([]);
    }
    const issueList = await getIssues();
    setAllIssues(issueList);
  }, [normalizedIssueId]);

  useEffect(() => {
    if (!ready || !normalizedIssueId) return;
    let active = true;
    const load = async () => {
      await reload();
      if (!active) return;
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, normalizedIssueId, reload]);

  const isWatching = Boolean(
    issue?.watcherIds?.includes(currentUserId),
  );

  const availableLinkTargets = useMemo(() => {
    if (!issue) return [];
    const search = linkSearch.toLowerCase();
    return allIssues
      .filter((item) => item.id !== issue.id)
      .filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.key.toLowerCase().includes(search),
      );
  }, [allIssues, issue, linkSearch]);

  const handleSaveTitle = async () => {
    if (!issue) return;
    const updated = await updateIssue(issue.id, { title: title.trim() });
    if (updated === false) return;
    await reload();
  };

  const handleSaveDescription = async () => {
    if (!issue) return;
    const updated = await updateIssue(issue.id, { description });
    if (updated === false) return;
    await reload();
  };

  const handleSaveStoryPoints = async () => {
    if (!issue) return;
    const trimmed = storyPoints.trim();
    if (!trimmed) {
      await updateIssue(issue.id, { storyPoints: undefined });
      await reload();
      return;
    }
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      Alert.alert("入力エラー", "ポイントは数値で入力してください。");
      return;
    }
    await updateIssue(issue.id, { storyPoints: numeric });
    await reload();
  };

  const handleSaveDueDate = async () => {
    if (!issue) return;
    const trimmed = dueDate.trim();
    if (!trimmed) {
      await updateIssue(issue.id, { dueDate: undefined });
      await reload();
      return;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      Alert.alert("入力エラー", "YYYY-MM-DD 形式で入力してください。");
      return;
    }
    await updateIssue(issue.id, { dueDate: date.toISOString() });
    await reload();
  };

  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue) return;
    const result = await updateIssueStatus(issue.id, status);
    if (!result) {
      Alert.alert("ステータス変更不可", "この遷移は許可されていません。");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reload();
  };

  const handleFieldUpdate = async (patch: Partial<Issue>) => {
    if (!issue) return;
    const updated = await updateIssue(issue.id, patch);
    if (updated === false) {
      Alert.alert("更新不可", "入力内容を確認してください。");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reload();
  };

  const handleCreateComment = async () => {
    if (!issue || !commentText.trim()) return;
    await addComment(issue.id, commentText.trim());
    setCommentText("");
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reload();
  };

  const handleLogWork = async () => {
    if (!issue) return;
    const minutes = Number(worklogMinutes);
    if (!minutes || minutes <= 0) return;
    await logWork(issue.id, minutes * 60, worklogComment.trim() || undefined);
    setWorklogMinutes("");
    setWorklogComment("");
    await reload();
  };

  const handleAddSubtask = async () => {
    if (!issue || !subtaskTitle.trim()) return;
    await createIssue({
      projectId: issue.projectId,
      title: subtaskTitle.trim(),
      parentId: issue.id,
      type: "Task",
      status: "To Do",
    });
    setSubtaskTitle("");
    await reload();
  };

  const handleAddLink = async (targetId: string) => {
    if (!issue) return;
    await addIssueLink(issue.id, targetId, selectedLinkType);
    setLinkSearch("");
    await reload();
  };

  const handleToggleWatch = async () => {
    if (!issue) return;
    await toggleWatch(issue.id);
    await reload();
  };

  const handleShare = async () => {
    if (!issue) return;
    const url = Linking.createURL(`/issue/${issue.id}`);
    await Share.share({
      message: `${issue.key}: ${issue.title}\n${url}`,
    });
  };

  const handleDelete = async () => {
    if (!issue) return;
    Alert.alert(
      "課題の削除",
      "この課題を削除しますか？この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除する",
          style: "destructive",
          onPress: async () => {
            await deleteIssue(issue.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleAddAttachment = async () => {
    if (!issue || !attachmentUri.trim()) return;
    const file = {
      uri: attachmentUri.trim(),
      name: attachmentName.trim() || "attachment",
      type: "application/octet-stream",
      size: 0,
    } as unknown as File;
    await addAttachment(issue.id, file);
    setAttachmentName("");
    setAttachmentUri("");
    await reload();
  };

  const handlePickAttachment = async () => {
    if (!issue) return;
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const picked = result.assets?.[0];
    if (!picked?.uri) return;
    setAttachmentName(picked.name ?? "");
    setAttachmentUri(picked.uri);
    const file = {
      uri: picked.uri,
      name: picked.name ?? "attachment",
      type: picked.mimeType ?? "application/octet-stream",
      size: picked.size ?? 0,
    } as unknown as File;
    await addAttachment(issue.id, file);
    setAttachmentName("");
    setAttachmentUri("");
    await reload();
  };

  const statusOptions = (Object.keys(STATUS_LABELS) as IssueStatus[]).map(
    (status) => ({
      value: status,
      label: STATUS_LABELS[status],
    }),
  );
  const priorityOptions = (Object.keys(PRIORITY_LABELS) as IssuePriority[]).map(
    (priority) => ({
      value: priority,
      label: PRIORITY_LABELS[priority],
    }),
  );
  const assigneeOptions = [
    { value: "unassigned", label: "未割り当て" },
    ...USERS.map((user) => ({ value: user.id, label: user.name })),
  ];

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Issue</ThemedText>
        {!ready ? (
          <ThemedView style={styles.card}>
            <Skeleton height={20} width={160} />
            <Skeleton height={14} width={240} />
          </ThemedView>
        ) : !issue ? (
          <EmptyState
            title="Issue not found."
            description="この課題は見つかりませんでした。"
          />
        ) : (
          <>
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              onBlur={handleSaveTitle}
              placeholder="タイトル"
            />
            <ThemedText type="subtitle">ステータス</ThemedText>
            <Pressable
              onPress={() => setActiveSheet("status")}
              style={styles.selector}
            >
              <ThemedText>{STATUS_LABELS[issue.status]}</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">優先度</ThemedText>
            <Pressable
              onPress={() => setActiveSheet("priority")}
              style={styles.selector}
            >
              <ThemedText>{PRIORITY_LABELS[issue.priority]}</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">タイプ</ThemedText>
            <ThemedView style={styles.rowWrap}>
              {(Object.keys(TYPE_LABELS) as IssueType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => handleFieldUpdate({ type })}
                  style={[
                    styles.option,
                    issue.type === type && styles.optionActive,
                  ]}
                >
                  <ThemedText>{TYPE_LABELS[type]}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
            <ThemedText type="subtitle">担当者</ThemedText>
            <Pressable
              onPress={() => setActiveSheet("assignee")}
              style={styles.selector}
            >
              <ThemedText>
                {issue.assigneeId
                  ? USERS.find((user) => user.id === issue.assigneeId)?.name ??
                    "未割り当て"
                  : "未割り当て"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">説明</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              onBlur={handleSaveDescription}
              multiline
              placeholder="詳細を入力..."
            />
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">ストーリーポイント</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="例: 3"
              value={storyPoints}
              onChangeText={setStoryPoints}
              onBlur={handleSaveStoryPoints}
              keyboardType="numeric"
            />
            <ThemedText type="subtitle">期限</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={setDueDate}
              onBlur={handleSaveDueDate}
            />
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">修正バージョン</ThemedText>
            <ThemedView style={styles.rowWrap}>
              <Pressable
                onPress={() => handleFieldUpdate({ fixVersionId: undefined })}
                style={[
                  styles.option,
                  !issue.fixVersionId && styles.optionActive,
                ]}
              >
                <ThemedText>なし</ThemedText>
              </Pressable>
              {versions.map((version) => (
                <Pressable
                  key={version.id}
                  onPress={() =>
                    handleFieldUpdate({ fixVersionId: version.id })
                  }
                  style={[
                    styles.option,
                    issue.fixVersionId === version.id &&
                      styles.optionActive,
                  ]}
                >
                  <ThemedText>{version.name}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </ThemedView>
          {project ? (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Project</ThemedText>
              <ThemedText>{project.name}</ThemedText>
              <ThemedText>{project.key}</ThemedText>
              <Pressable
                onPress={() => router.push(`/project/${project.id}`)}
                style={styles.linkButton}
              >
                <ThemedText type="link">Open project</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">ウォッチ</ThemedText>
            <Pressable onPress={handleToggleWatch} style={styles.primaryButton}>
              <ThemedText type="link">
                {isWatching ? "ウォッチ解除" : "ウォッチする"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">コメント</ThemedText>
            <TextInput
              ref={commentInputRef}
              style={[styles.input, styles.textArea]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="コメントを入力..."
              multiline
            />
            <Pressable onPress={handleCreateComment} style={styles.primaryButton}>
              <ThemedText type="link">送信</ThemedText>
            </Pressable>
            {(issue.comments ?? [])
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((comment) => (
                <ThemedView key={comment.id} style={styles.rowCard}>
                  <ThemedText type="defaultSemiBold">
                    {USERS.find((user) => user.id === comment.authorId)?.name ??
                      "User"}
                  </ThemedText>
                  <ThemedText>{comment.content}</ThemedText>
                  <ThemedText style={styles.metaText}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              ))}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">作業ログ</ThemedText>
            {(issue.workLogs ?? [])
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((log) => (
                <ThemedView key={log.id} style={styles.rowCard}>
                  <ThemedText type="defaultSemiBold">
                    {(log.timeSpentSeconds / 3600).toFixed(1)}h
                  </ThemedText>
                  <ThemedText>{log.comment || "コメントなし"}</ThemedText>
                  <ThemedText style={styles.metaText}>
                    {new Date(log.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              ))}
            <TextInput
              style={styles.input}
              value={worklogMinutes}
              onChangeText={setWorklogMinutes}
              keyboardType="numeric"
              placeholder="時間 (分)"
            />
            <TextInput
              style={styles.input}
              value={worklogComment}
              onChangeText={setWorklogComment}
              placeholder="説明 (任意)"
            />
            <Pressable onPress={handleLogWork} style={styles.primaryButton}>
              <ThemedText type="link">時間を記録</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">履歴</ThemedText>
            {(issue.history ?? [])
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((entry) => (
                <ThemedView key={entry.id} style={styles.rowCard}>
                  <ThemedText type="defaultSemiBold">
                    {entry.field}
                  </ThemedText>
                  <ThemedText>
                    {String(entry.from ?? "なし")} {"->"} {String(entry.to)}
                  </ThemedText>
                  <ThemedText style={styles.metaText}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              ))}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">サブタスク</ThemedText>
            {subtasks.length === 0 ? (
              <ThemedText>サブタスクはありません。</ThemedText>
            ) : (
              subtasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/issue/${task.id}`)}
                  style={styles.rowCard}
                >
                  <ThemedText type="defaultSemiBold">{task.key}</ThemedText>
                  <ThemedText>{task.title}</ThemedText>
                </Pressable>
              ))
            )}
            <TextInput
              style={styles.input}
              value={subtaskTitle}
              onChangeText={setSubtaskTitle}
              placeholder="サブタスクのタイトル"
            />
            <Pressable onPress={handleAddSubtask} style={styles.primaryButton}>
              <ThemedText type="link">サブタスクを追加</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">関連する課題</ThemedText>
            {(issue.links ?? []).map((link) => {
              const target = allIssues.find(
                (item) => item.id === link.outwardIssueId,
              );
              return (
                <ThemedView key={link.id} style={styles.rowCard}>
                  <ThemedText type="defaultSemiBold">
                    {link.type}
                  </ThemedText>
                  <ThemedText>
                    {target ? `${target.key} ${target.title}` : "Unknown"}
                  </ThemedText>
                </ThemedView>
              );
            })}
            <ThemedText type="subtitle">リンクを追加</ThemedText>
            <ThemedView style={styles.rowWrap}>
              {(["blocks", "is blocked by", "relates to"] as const).map(
                (type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedLinkType(type)}
                    style={[
                      styles.option,
                      selectedLinkType === type && styles.optionActive,
                    ]}
                  >
                    <ThemedText>{type}</ThemedText>
                  </Pressable>
                ),
              )}
            </ThemedView>
            <TextInput
              style={styles.input}
              value={linkSearch}
              onChangeText={setLinkSearch}
              placeholder="課題を検索..."
            />
            {linkSearch.length > 0
              ? availableLinkTargets.map((target) => (
                  <Pressable
                    key={target.id}
                    onPress={() => handleAddLink(target.id)}
                    style={styles.rowCard}
                  >
                    <ThemedText type="defaultSemiBold">
                      {target.key}
                    </ThemedText>
                    <ThemedText>{target.title}</ThemedText>
                  </Pressable>
                ))
              : null}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">添付ファイル</ThemedText>
            {(issue.attachments ?? []).map((attachment) => (
              <ThemedView key={attachment.id} style={styles.rowCard}>
                <ThemedText type="defaultSemiBold">
                  {attachment.fileName}
                </ThemedText>
                <ThemedText>{attachment.fileType}</ThemedText>
              </ThemedView>
            ))}
            <Pressable onPress={handlePickAttachment} style={styles.primaryButton}>
              <ThemedText type="link">ファイルを選択</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">URL/URIから追加</ThemedText>
            <TextInput
              style={styles.input}
              value={attachmentName}
              onChangeText={setAttachmentName}
              placeholder="ファイル名"
            />
            <TextInput
              style={styles.input}
              value={attachmentUri}
              onChangeText={setAttachmentUri}
              placeholder="URI / URL"
            />
            <Pressable onPress={handleAddAttachment} style={styles.primaryButton}>
              <ThemedText type="link">添付を追加</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">共有 / 削除</ThemedText>
            <Pressable onPress={handleShare} style={styles.primaryButton}>
              <ThemedText type="link">共有する</ThemedText>
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.dangerButton}>
              <ThemedText type="link">削除する</ThemedText>
            </Pressable>
          </ThemedView>
        </>
      )}
    </ScrollView>
    {issue ? (
      <ThemedView style={styles.actionBar}>
        <Pressable
          onPress={() => commentInputRef.current?.focus()}
          style={styles.actionButton}
          accessibilityLabel="コメントを追加"
        >
          <ThemedText type="link">コメント</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveSheet("status")}
          style={styles.actionButton}
          accessibilityLabel="ステータスを変更"
        >
          <ThemedText type="link">ステータス</ThemedText>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert("その他", "操作を選択してください。", [
              { text: "共有", onPress: handleShare },
              {
                text: isWatching ? "ウォッチ解除" : "ウォッチ",
                onPress: handleToggleWatch,
              },
              { text: "削除", style: "destructive", onPress: handleDelete },
              { text: "キャンセル", style: "cancel" },
            ])
          }
          style={styles.actionButton}
          accessibilityLabel="その他の操作"
        >
          <ThemedText type="link">その他</ThemedText>
        </Pressable>
      </ThemedView>
    ) : null}
    <SelectionSheet
      visible={activeSheet === "status"}
      title="ステータスを選択"
      options={statusOptions}
      onSelect={(value) => {
        void handleStatusChange(value as IssueStatus);
        setActiveSheet(null);
      }}
      onClose={() => setActiveSheet(null)}
    />
    <SelectionSheet
      visible={activeSheet === "priority"}
      title="優先度を選択"
      options={priorityOptions}
      onSelect={(value) => {
        void handleFieldUpdate({ priority: value as IssuePriority });
        setActiveSheet(null);
      }}
      onClose={() => setActiveSheet(null)}
    />
    <SelectionSheet
      visible={activeSheet === "assignee"}
      title="担当者を選択"
      options={assigneeOptions}
      onSelect={(value) => {
        void handleFieldUpdate({
          assigneeId: value === "unassigned" ? undefined : value,
        });
        setActiveSheet(null);
      }}
      onClose={() => setActiveSheet(null)}
    />
  </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
  },
  card: {
    borderRadius: 16,
    gap: 6,
    padding: 16,
  },
  container: {
    gap: 16,
    padding: 24,
    paddingBottom: 120,
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 12,
  },
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  metaText: {
    color: "#6b7280",
    fontSize: 12,
  },
  option: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionActive: {
    borderColor: "#2563eb",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  screen: {
    flex: 1,
  },
  selector: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowCard: {
    borderRadius: 12,
    gap: 4,
    padding: 12,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});
