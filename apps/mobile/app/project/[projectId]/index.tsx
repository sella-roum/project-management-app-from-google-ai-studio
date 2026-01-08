import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import type { Issue, Project, Version } from "@repo/core";
import {
  createVersion,
  deleteProject,
  getAutomationRules,
  getIssues,
  getProjectById,
  getVersions,
  recordView,
  toggleAutomationRule,
  updateProject,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

const TABS = [
  "Summary",
  "Board",
  "Backlog",
  "Timeline",
  "Releases",
  "Automation",
  "Settings",
] as const;

export default function ProjectViewScreen() {
  const ready = useStorageReady();
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const normalizedProjectId = useMemo(
    () => (Array.isArray(projectId) ? projectId[0] : projectId),
    [projectId],
  );
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Summary");
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [newVersionName, setNewVersionName] = useState("");
  const [automationRules, setAutomationRules] = useState<
    { id: string; name: string; enabled: boolean }[]
  >([]);

  const reload = useCallback(async () => {
    if (!normalizedProjectId) return;
    const [projectData, issueData, versionData, ruleData] =
      await Promise.all([
        getProjectById(normalizedProjectId),
        getIssues(normalizedProjectId),
        getVersions(normalizedProjectId),
        getAutomationRules(normalizedProjectId),
      ]);
    setProject(projectData);
    setIssues(issueData);
    setVersions(versionData);
    setAutomationRules(ruleData.map((rule) => rule));
    setProjectName(projectData?.name ?? "");
    setProjectKey(projectData?.key ?? "");
    setProjectDescription(projectData?.description ?? "");
  }, [normalizedProjectId]);

  useEffect(() => {
    if (!ready || !normalizedProjectId) return;
    void reload();
  }, [ready, normalizedProjectId, reload]);

  const handleSaveSettings = async () => {
    if (!normalizedProjectId) return;
    await updateProject(normalizedProjectId, {
      name: projectName,
      key: projectKey,
      description: projectDescription,
    });
    await reload();
  };

  const handleDeleteProject = async () => {
    if (!normalizedProjectId) return;
    await deleteProject(normalizedProjectId);
    router.replace("/(tabs)/projects");
  };

  const handleCreateVersion = async () => {
    if (!normalizedProjectId || !newVersionName) return;
    await createVersion({
      projectId: normalizedProjectId,
      name: newVersionName,
    });
    setNewVersionName("");
    await reload();
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    await toggleAutomationRule(ruleId, !enabled);
    await reload();
  };

  const handleOpenIssue = async (issueId: string) => {
    await recordView(issueId);
  };

  const groupedIssues = useMemo(() => {
    return issues.reduce<Record<string, Issue[]>>((acc, issue) => {
      acc[issue.status] = acc[issue.status] || [];
      acc[issue.status].push(issue);
      return acc;
    }, {});
  }, [issues]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Project</ThemedText>
      {!ready ? (
        <ThemedText>Loading project...</ThemedText>
      ) : project ? (
        <>
          <ThemedText type="subtitle">{project.name}</ThemedText>
          <ThemedText>{project.key}</ThemedText>
          <Link
            href={{
              pathname: "/modal",
              params: { mode: "issue", projectId: project.id },
            }}
          >
            <ThemedText type="link">Create issue</ThemedText>
          </Link>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ThemedView style={styles.tabRow}>
              {TABS.map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                >
                  <ThemedText>{tab}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </ScrollView>

          {activeTab === "Summary" ? (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Summary</ThemedText>
              <ThemedText>{issues.length} issues</ThemedText>
              <ThemedText>{versions.length} versions</ThemedText>
            </ThemedView>
          ) : null}

          {activeTab === "Board" ? (
            <ThemedView style={styles.section}>
              {Object.entries(groupedIssues).map(([status, items]) => (
                <ThemedView key={status} style={styles.card}>
                  <ThemedText type="defaultSemiBold">{status}</ThemedText>
                  {items.map((issue) => (
                    <Pressable
                      key={issue.id}
                      onPress={() => handleOpenIssue(issue.id)}
                      style={styles.issueRow}
                    >
                      <ThemedText type="defaultSemiBold">
                        {issue.key}
                      </ThemedText>
                      <ThemedText>{issue.title}</ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              ))}
            </ThemedView>
          ) : null}

          {activeTab === "Backlog" ? (
            <ThemedView style={styles.section}>
              {issues.map((issue) => (
                <Pressable
                  key={issue.id}
                  onPress={() => handleOpenIssue(issue.id)}
                  style={styles.card}
                >
                  <ThemedText type="defaultSemiBold">{issue.key}</ThemedText>
                  <ThemedText>{issue.title}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          ) : null}

          {activeTab === "Timeline" ? (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold">Timeline</ThemedText>
              <ThemedText>
                スプリントや期限情報は今後のアップデートで追加されます。
              </ThemedText>
            </ThemedView>
          ) : null}

          {activeTab === "Releases" ? (
            <ThemedView style={styles.section}>
              <TextInput
                style={styles.input}
                placeholder="Version name"
                value={newVersionName}
                onChangeText={setNewVersionName}
              />
              <Pressable onPress={handleCreateVersion} style={styles.primaryBtn}>
                <ThemedText type="link">Add version</ThemedText>
              </Pressable>
              {versions.map((version) => (
                <ThemedView key={version.id} style={styles.card}
                >
                  <ThemedText type="defaultSemiBold">
                    {version.name}
                  </ThemedText>
                  <ThemedText>{version.status}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          ) : null}

          {activeTab === "Automation" ? (
            <ThemedView style={styles.section}>
              {automationRules.length === 0 ? (
                <ThemedText>Automation rules are not set.</ThemedText>
              ) : (
                automationRules.map((rule) => (
                  <Pressable
                    key={rule.id}
                    onPress={() => handleToggleRule(rule.id, rule.enabled)}
                    style={styles.card}
                  >
                    <ThemedText type="defaultSemiBold">{rule.name}</ThemedText>
                    <ThemedText>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </ThemedView>
          ) : null}

          {activeTab === "Settings" ? (
            <ThemedView style={styles.section}>
              <TextInput
                style={styles.input}
                placeholder="Project name"
                value={projectName}
                onChangeText={setProjectName}
              />
              <TextInput
                style={styles.input}
                placeholder="Project key"
                value={projectKey}
                onChangeText={(value) => setProjectKey(value.toUpperCase())}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={projectDescription}
                onChangeText={setProjectDescription}
              />
              <Pressable onPress={handleSaveSettings} style={styles.primaryBtn}>
                <ThemedText type="link">Save settings</ThemedText>
              </Pressable>
              <Pressable onPress={handleDeleteProject} style={styles.dangerBtn}>
                <ThemedText type="link">Delete project</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}
        </>
      ) : (
        <ThemedText>Project not found.</ThemedText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    gap: 6,
    padding: 16,
  },
  container: {
    gap: 16,
    padding: 24,
  },
  dangerBtn: {
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
  issueRow: {
    gap: 4,
  },
  primaryBtn: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  section: {
    gap: 12,
  },
  tab: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabActive: {
    borderColor: "#2563eb",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
});
