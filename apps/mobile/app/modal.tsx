import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import type { IssuePriority, IssueStatus, IssueType, Project } from "@repo/core";
import { CATEGORY_LABELS } from "@repo/core";
import {
  USERS,
  createIssue,
  createProject,
  getCurrentUserId,
  getProjects,
} from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radius, Spacing } from "@/constants/theme";
import { useStorageReady } from "@/hooks/use-storage";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ModalScreen() {
  const router = useRouter();
  const ready = useStorageReady();
  const borderSubtle = useThemeColor({}, "borderSubtle");
  const brandPrimary = useThemeColor({}, "brandPrimary");
  const { mode, projectId } = useLocalSearchParams<{
    mode?: string;
    projectId?: string;
  }>();
  const activeMode = mode === "project" ? "project" : "issue";

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<IssueType>("Task");
  const [status, setStatus] = useState<IssueStatus>("To Do");
  const [priority, setPriority] = useState<IssuePriority>("Medium");
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [projectName, setProjectName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectType, setProjectType] = useState<"Scrum" | "Kanban">("Kanban");
  const [projectCategory, setProjectCategory] = useState<
    "Software" | "Business"
  >("Software");

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const list = await getProjects();
      setProjects(list);
      if (projectId && typeof projectId === "string") {
        setSelectedProjectId(projectId);
      } else if (list[0]) {
        setSelectedProjectId(list[0].id);
      }
    };
    void load();
  }, [ready, projectId]);

  const canSubmitIssue = useMemo(
    () => selectedProjectId && title.trim().length > 0,
    [selectedProjectId, title],
  );

  const handleCreateIssue = async () => {
    if (!canSubmitIssue) return;
    await createIssue({
      projectId: selectedProjectId,
      title,
      description,
      type: issueType,
      status,
      priority,
      assigneeId,
    });
    router.back();
  };

  const handleCreateProject = async () => {
    if (!projectName) return;
    await createProject({
      name: projectName,
      key: projectKey || projectName.substring(0, 3).toUpperCase(),
      type: projectType,
      category: projectCategory,
      iconUrl: projectType === "Scrum" ? "??" : "??",
      description,
      leadId: getCurrentUserId(),
    });
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">
        {activeMode === "project" ? "Create project" : "Create issue"}
      </ThemedText>
      {activeMode === "issue" ? (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Project</ThemedText>
          {projects.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => setSelectedProjectId(project.id)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                selectedProjectId === project.id && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText type="defaultSemiBold">{project.name}</ThemedText>
              <ThemedText>{project.key}</ThemedText>
            </Pressable>
          ))}
          <Input
            placeholder="Issue title"
            value={title}
            onChangeText={setTitle}
          />
          <Input
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <ThemedText type="subtitle">Type</ThemedText>
          {(["Task", "Bug", "Story", "Epic"] as IssueType[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setIssueType(value)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                issueType === value && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText>{value}</ThemedText>
            </Pressable>
          ))}
          <ThemedText type="subtitle">Status</ThemedText>
          {(["To Do", "In Progress", "In Review", "Done"] as IssueStatus[]).map(
            (value) => (
            <Pressable
              key={value}
              onPress={() => setStatus(value)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                status === value && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText>{value}</ThemedText>
            </Pressable>
          ))}
          <ThemedText type="subtitle">Priority</ThemedText>
          {(
            ["Highest", "High", "Medium", "Low", "Lowest"] as IssuePriority[]
          ).map((value) => (
            <Pressable
              key={value}
              onPress={() => setPriority(value)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                priority === value && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText>{value}</ThemedText>
            </Pressable>
          ))}
          <ThemedText type="subtitle">Assignee</ThemedText>
          {USERS.map((user) => (
            <Pressable
              key={user.id}
              onPress={() => setAssigneeId(user.id)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                assigneeId === user.id && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText>{user.name}</ThemedText>
            </Pressable>
          ))}
          <Button
            label="Create"
            onPress={handleCreateIssue}
            disabled={!canSubmitIssue}
          />
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <Input
            placeholder="Project name"
            value={projectName}
            onChangeText={setProjectName}
          />
          <Input
            placeholder="Project key"
            value={projectKey}
            onChangeText={(value) => setProjectKey(value.toUpperCase())}
            maxLength={5}
          />
          <Input
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <ThemedText type="subtitle">Category</ThemedText>
          {(["Software", "Business"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setProjectCategory(value)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                projectCategory === value && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText>{CATEGORY_LABELS[value]}</ThemedText>
            </Pressable>
          ))}
          {(["Kanban", "Scrum"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setProjectType(value)}
              style={[
                styles.option,
                { borderColor: borderSubtle },
                projectType === value && { borderColor: brandPrimary },
              ]}
            >
              <ThemedText>{value}</ThemedText>
            </Pressable>
          ))}
          <Button label="Create" onPress={handleCreateProject} />
        </ThemedView>
      )}
      <Button label="Cancel" onPress={() => router.back()} variant="ghost" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.l,
    padding: Spacing.xl,
  },
  option: {
    borderRadius: Radius.m,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.m,
  },
  section: {
    gap: Spacing.m,
  },
});
