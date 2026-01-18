import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Share,
  View,
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
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Elevation, Radius, Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function IssueDetailScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const { issueId } = useLocalSearchParams<{ issueId: string }>();
  const actionBarBackground = useThemeColor({}, "surfaceRaised");
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const brandPrimary = useThemeColor({}, "brandPrimary");
  const dangerBackground = useThemeColor({}, "stateErrorBg");
  const textOnBrand = useThemeColor({}, "textOnBrand");
  const metaTextColor = useThemeColor({}, "textTertiary");
  const warningBackground = useThemeColor({}, "stateWarningBg");
  const warningText = useThemeColor({}, "stateWarningText");
  const errorBackground = useThemeColor({}, "stateErrorBg");
  const errorText = useThemeColor({}, "stateErrorText");
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
  const isHighPriority =
    issue?.priority === "High" || issue?.priority === "Highest";
  const isOverdue = Boolean(
    issue?.dueDate && new Date(issue.dueDate).getTime() < Date.now(),
  );

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
            <ThemedText type="bodySemiBold">{issue.key}</ThemedText>
            <Input
              value={title}
              onChangeText={setTitle}
              onBlur={handleSaveTitle}
              placeholder="タイトル"
            />
            <ThemedText type="headline">ステータス</ThemedText>
            <Pressable
              onPress={() => setActiveSheet("status")}
              style={styles.selector}
            >
              <ThemedText>{STATUS_LABELS[issue.status]}</ThemedText>
            </Pressable>
            <ThemedText type="headline">優先度</ThemedText>
            <Pressable
              onPress={() => setActiveSheet("priority")}
              style={styles.selector}
            >
              <ThemedText>{PRIORITY_LABELS[issue.priority]}</ThemedText>
            </Pressable>
            <ThemedText type="headline">期限</ThemedText>
            <Input
              placeholder="YYYY-MM-DD"
              value={dueDate}
              onChangeText={setDueDate}
              onBlur={handleSaveDueDate}
            />
            {(isHighPriority || isOverdue) && (
              <ThemedView style={styles.rowWrap}>
                {isHighPriority ? (
                  <Chip
                    label="高優先度"
                    variant="solid"
                    backgroundColor={warningBackground}
                    textColor={warningText}
                    borderColor={warningBackground}
                  />
                ) : null}
                {isOverdue ? (
                  <Chip
                    label="期限切れ"
                    variant="solid"
                    backgroundColor={errorBackground}
                    textColor={errorText}
                    borderColor={errorBackground}
                  />
                ) : null}
              </ThemedView>
            )}
            <ThemedText type="headline">タイプ</ThemedText>
            <ThemedView style={styles.rowWrap}>
              {(Object.keys(TYPE_LABELS) as IssueType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => handleFieldUpdate({ type })}
                  style={[
                    styles.option,
                    issue.type === type && { borderColor: brandPrimary },
                  ]}
                >
                  <ThemedText>{TYPE_LABELS[type]}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
            <ThemedText type="headline">担当者</ThemedText>
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
            <ThemedText type="headline">説明</ThemedText>
            <Input
              value={description}
              onChangeText={setDescription}
              onBlur={handleSaveDescription}
              multiline
              placeholder="詳細を入力..."
              style={styles.textArea}
            />
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">ストーリーポイント</ThemedText>
            <Input
              placeholder="例: 3"
              value={storyPoints}
              onChangeText={setStoryPoints}
              onBlur={handleSaveStoryPoints}
              keyboardType="numeric"
            />
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">修正バージョン</ThemedText>
            <ThemedView style={styles.rowWrap}>
              <Pressable
                onPress={() => handleFieldUpdate({ fixVersionId: undefined })}
                style={[
                  styles.option,
                  !issue.fixVersionId && { borderColor: brandPrimary },
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
                    issue.fixVersionId === version.id && {
                      borderColor: brandPrimary,
                    },
                  ]}
                >
                  <ThemedText>{version.name}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </ThemedView>
          {project ? (
            <ThemedView style={styles.card}>
              <ThemedText type="bodySemiBold">Project</ThemedText>
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
            <ThemedText type="headline">ウォッチ</ThemedText>
            <Pressable
              onPress={handleToggleWatch}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                {isWatching ? "ウォッチ解除" : "ウォッチする"}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">コメント</ThemedText>
            <Input
              ref={commentInputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="コメントを入力..."
              multiline
              style={styles.textArea}
            />
            <Pressable
              onPress={handleCreateComment}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                送信
              </ThemedText>
            </Pressable>
            {(issue.comments ?? [])
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((comment) => (
                <ThemedView
                  key={comment.id}
                  style={[styles.listItem, { borderBottomColor: borderSubtle }]}
                >
                  <ThemedText type="bodySemiBold">
                    {USERS.find((user) => user.id === comment.authorId)?.name ??
                      "User"}
                  </ThemedText>
                  <ThemedText>{comment.content}</ThemedText>
                  <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              ))}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">作業ログ</ThemedText>
            {(issue.workLogs ?? [])
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((log) => (
                <ThemedView
                  key={log.id}
                  style={[styles.listItem, { borderBottomColor: borderSubtle }]}
                >
                  <ThemedText type="bodySemiBold">
                    {(log.timeSpentSeconds / 3600).toFixed(1)}h
                  </ThemedText>
                  <ThemedText>{log.comment || "コメントなし"}</ThemedText>
                  <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
                    {new Date(log.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              ))}
            <Input
              value={worklogMinutes}
              onChangeText={setWorklogMinutes}
              keyboardType="numeric"
              placeholder="時間 (分)"
            />
            <Input
              value={worklogComment}
              onChangeText={setWorklogComment}
              placeholder="説明 (任意)"
            />
            <Pressable
              onPress={handleLogWork}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                時間を記録
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">履歴</ThemedText>
            {(issue.history ?? [])
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((entry) => (
                <ThemedView
                  key={entry.id}
                  style={[styles.listItem, { borderBottomColor: borderSubtle }]}
                >
                  <ThemedText type="bodySemiBold">
                    {entry.field}
                  </ThemedText>
                  <ThemedText>
                    {String(entry.from ?? "なし")} {"->"} {String(entry.to)}
                  </ThemedText>
                  <ThemedText type="caption" style={[styles.metaText, { color: metaTextColor }]}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </ThemedText>
                </ThemedView>
              ))}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">サブタスク</ThemedText>
            {subtasks.length === 0 ? (
              <ThemedText>サブタスクはありません。</ThemedText>
            ) : (
              subtasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => router.push(`/issue/${task.id}`)}
                  style={styles.rowCard}
                >
                  <ThemedText type="bodySemiBold">{task.key}</ThemedText>
                  <ThemedText>{task.title}</ThemedText>
                </Pressable>
              ))
            )}
            <Input
              value={subtaskTitle}
              onChangeText={setSubtaskTitle}
              placeholder="サブタスクのタイトル"
            />
            <Pressable
              onPress={handleAddSubtask}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                サブタスクを追加
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">関連する課題</ThemedText>
            {(issue.links ?? []).map((link) => {
              const target = allIssues.find(
                (item) => item.id === link.outwardIssueId,
              );
              return (
                <ThemedView key={link.id} style={styles.rowCard}>
                  <ThemedText type="bodySemiBold">
                    {link.type}
                  </ThemedText>
                  <ThemedText>
                    {target ? `${target.key} ${target.title}` : "Unknown"}
                  </ThemedText>
                </ThemedView>
              );
            })}
            <ThemedText type="headline">リンクを追加</ThemedText>
            <ThemedView style={styles.rowWrap}>
              {(["blocks", "is blocked by", "relates to"] as const).map(
                (type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedLinkType(type)}
                    style={[
                      styles.option,
                      selectedLinkType === type && { borderColor: brandPrimary },
                    ]}
                  >
                    <ThemedText>{type}</ThemedText>
                  </Pressable>
                ),
              )}
            </ThemedView>
            <Input
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
                    <ThemedText type="bodySemiBold">
                      {target.key}
                    </ThemedText>
                    <ThemedText>{target.title}</ThemedText>
                  </Pressable>
                ))
              : null}
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">添付ファイル</ThemedText>
            {(issue.attachments ?? []).map((attachment) => (
              <ThemedView key={attachment.id} style={styles.rowCard}>
                <ThemedText type="bodySemiBold">
                  {attachment.fileName}
                </ThemedText>
                <ThemedText>{attachment.fileType}</ThemedText>
              </ThemedView>
            ))}
            <Pressable
              onPress={handlePickAttachment}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                ファイルを選択
              </ThemedText>
            </Pressable>
            <ThemedText type="headline">URL/URIから追加</ThemedText>
            <Input
              value={attachmentName}
              onChangeText={setAttachmentName}
              placeholder="ファイル名"
            />
            <Input
              value={attachmentUri}
              onChangeText={setAttachmentUri}
              placeholder="URI / URL"
            />
            <Pressable
              onPress={handleAddAttachment}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                添付を追加
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="headline">共有 / 削除</ThemedText>
            <Pressable
              onPress={handleShare}
              style={[styles.primaryButton, { backgroundColor: brandPrimary }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                共有する
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.dangerButton, { backgroundColor: dangerBackground }]}
            >
              <ThemedText type="link" style={{ color: textOnBrand }}>
                削除する
              </ThemedText>
            </Pressable>
          </ThemedView>
        </>
      )}
    </ScrollView>
    {issue ? (
      <ThemedView
        style={[
          styles.actionBar,
          { backgroundColor: actionBarBackground, borderTopColor: borderSubtle },
        ]}
      >
        <View style={styles.actionItem}>
          <Button
            label="コメント"
            onPress={() => commentInputRef.current?.focus()}
            variant="ghost"
            fullWidth
          />
        </View>
        <View style={styles.actionItem}>
          <Button
            label="ステータス"
            onPress={() => setActiveSheet("status")}
            variant="ghost"
            fullWidth
          />
        </View>
        <View style={styles.actionItem}>
          <Button
            label="その他"
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
            variant="ghost"
            fullWidth
          />
        </View>
      </ThemedView>
    ) : null}
    <SelectionSheet
      visible={activeSheet === "status"}
      title="ステータスを選択"
      options={statusOptions}
      selectedValue={issue?.status}
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
      selectedValue={issue?.priority}
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
      selectedValue={issue?.assigneeId ?? "unassigned"}
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
    borderTopWidth: 1,
    flexDirection: "row",
    gap: Spacing.s,
    justifyContent: "space-between",
    left: 0,
    position: "absolute",
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.l,
    paddingVertical: Spacing.m,
    ...Elevation.medium,
  },
  actionItem: {
    flex: 1,
  },
  card: {
    borderRadius: Radius.l,
    gap: Spacing.s,
    padding: Spacing.l,
  },
  container: {
    gap: Spacing.l,
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  dangerButton: {
    alignItems: "center",
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  listItem: {
    borderBottomWidth: 1,
    gap: Spacing.xs,
    paddingVertical: Spacing.s,
  },
  metaText: {
    fontSize: 12,
  },
  option: {
    borderRadius: Radius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: Radius.m,
    paddingVertical: Spacing.m,
  },
  screen: {
    flex: 1,
  },
  selector: {
    borderRadius: Radius.m,
    borderWidth: 1,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
  },
  rowCard: {
    borderRadius: Radius.m,
    gap: Spacing.xs,
    padding: Spacing.m,
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
