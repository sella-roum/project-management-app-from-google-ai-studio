import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";

import type { IssuePriority, IssueStatus, IssueType, Project } from "@repo/core";
import { CATEGORY_LABELS } from "@repo/core";
import { USERS, createIssue, createProject, getProjects } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

export default function ModalScreen() {
  const router = useRouter();
  const ready = useStorageReady();
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
                selectedProjectId === project.id && styles.optionActive,
              ]}
            >
              <ThemedText type="defaultSemiBold">{project.name}</ThemedText>
              <ThemedText>{project.key}</ThemedText>
            </Pressable>
          ))}
          <TextInput
            style={styles.input}
            placeholder="Issue title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
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
                issueType === value && styles.optionActive,
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
                status === value && styles.optionActive,
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
                priority === value && styles.optionActive,
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
                assigneeId === user.id && styles.optionActive,
              ]}
            >
              <ThemedText>{user.name}</ThemedText>
            </Pressable>
          ))}
          <Pressable
            onPress={handleCreateIssue}
            disabled={!canSubmitIssue}
            style={styles.primaryButton}
          >
            <ThemedText type="link">Create</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
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
            maxLength={5}
          />
          <TextInput
            style={styles.input}
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
                projectCategory === value && styles.optionActive,
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
                projectType === value && styles.optionActive,
              ]}
            >
              <ThemedText>{value}</ThemedText>
            </Pressable>
          ))}
          <Pressable onPress={handleCreateProject} style={styles.primaryButton}>
            <ThemedText type="link">Create</ThemedText>
          </Pressable>
        </ThemedView>
      )}
      <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
        <ThemedText type="link">Cancel</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 20,
  },
  input: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  option: {
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 10,
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
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
  },
  section: {
    gap: 12,
  },
});
