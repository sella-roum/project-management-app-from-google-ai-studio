import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput , Share } from "react-native";
import * as Linking from "expo-linking";
import * as DocumentPicker from "expo-document-picker";

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

  const currentUserId = getCurrentUserId();

  const reload = useCallback(async () => {
    if (!normalizedIssueId) return;
    const issueData = await getIssueById(normalizedIssueId);
    setIssue(issueData);
    if (issueData) {
      setTitle(issueData.title);
      setDescription(issueData.description ?? "");
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

  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue) return;
    const result = await updateIssueStatus(issue.id, status);
    if (!result) {
      Alert.alert("ステータス変更不可", "この遷移は許可されていません。");
      return;
    }
    await reload();
  };

  const handleFieldUpdate = async (patch: Partial<Issue>) => {
    if (!issue) return;
    const updated = await updateIssue(issue.id, patch);
    if (updated === false) {
      Alert.alert("更新不可", "入力内容を確認してください。");
      return;
    }
    await reload();
  };

  const handleCreateComment = async () => {
    if (!issue || !commentText.trim()) return;
    await addComment(issue.id, commentText.trim());
    setCommentText("");
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Issue</ThemedText>
      {!ready ? (
        <ThemedText>Loading issue...</ThemedText>
      ) : !issue ? (
        <ThemedText>Issue not found.</ThemedText>
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
            <ThemedView style={styles.rowWrap}>
              {(Object.keys(STATUS_LABELS) as IssueStatus[]).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => handleStatusChange(status)}
                  style={[
                    styles.option,
                    issue.status === status && styles.optionActive,
                  ]}
                >
                  <ThemedText>{STATUS_LABELS[status]}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
            <ThemedText type="subtitle">優先度</ThemedText>
            <ThemedView style={styles.rowWrap}>
              {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map(
                (priority) => (
                  <Pressable
                    key={priority}
                    onPress={() => handleFieldUpdate({ priority })}
                    style={[
                      styles.option,
                      issue.priority === priority && styles.optionActive,
                    ]}
                  >
                    <ThemedText>{PRIORITY_LABELS[priority]}</ThemedText>
                  </Pressable>
                ),
              )}
            </ThemedView>
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
            <ThemedView style={styles.rowWrap}>
              <Pressable
                onPress={() => handleFieldUpdate({ assigneeId: undefined })}
                style={[
                  styles.option,
                  !issue.assigneeId && styles.optionActive,
                ]}
              >
                <ThemedText>未割り当て</ThemedText>
              </Pressable>
              {USERS.map((user) => (
                <Pressable
                  key={user.id}
                  onPress={() => handleFieldUpdate({ assigneeId: user.id })}
                  style={[
                    styles.option,
                    issue.assigneeId === user.id && styles.optionActive,
                  ]}
                >
                  <ThemedText>{user.name}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
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
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 6,
    padding: 16,
  },
  container: {
    gap: 16,
    padding: 24,
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
