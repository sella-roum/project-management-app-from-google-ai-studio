import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { getProjects, toggleProjectStar } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

type ProjectSummary = {
  id: string;
  key: string;
  name: string;
  type: string;
  starred?: boolean;
};

export default function ProjectsScreen() {
  const ready = useStorageReady();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const data = await getProjects();
      setProjects(
        data.map((project) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          type: project.type,
          starred: project.starred,
        })),
      );
    };
    void load();
  }, [ready]);

  const handleToggleStar = async (projectId: string) => {
    await toggleProjectStar(projectId);
    const data = await getProjects();
    setProjects(
      data.map((project) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        type: project.type,
        starred: project.starred,
      })),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Projects</ThemedText>
      {!ready ? (
        <ThemedText>Loading projects...</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          <Link href={{ pathname: "/modal", params: { mode: "project" } }}>
            <ThemedText type="link">Create project</ThemedText>
          </Link>
          {projects.length === 0 ? (
            <ThemedText>No projects yet.</ThemedText>
          ) : (
            projects.map((project) => (
              <ThemedView key={project.id} style={styles.card}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedText type="defaultSemiBold">{project.name}</ThemedText>
                  <Pressable
                    onPress={() => handleToggleStar(project.id)}
                    style={styles.starButton}
                  >
                    <ThemedText>
                      {project.starred ? "★" : "☆"}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
                <ThemedText>{project.key}</ThemedText>
                <ThemedText>{project.type}</ThemedText>
                <Link href={`/projects/${project.id}`}>
                  <ThemedText type="link">Open project</ThemedText>
                </Link>
              </ThemedView>
            ))
          )}
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    gap: 4,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    gap: 12,
    padding: 24,
  },
  list: {
    gap: 12,
  },
  starButton: {
    paddingHorizontal: 8,
  },
});
