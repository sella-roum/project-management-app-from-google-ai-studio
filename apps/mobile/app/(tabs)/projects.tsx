import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { getProjects } from "@repo/storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStorageReady } from "@/hooks/use-storage";

type ProjectSummary = {
  id: string;
  key: string;
  name: string;
  type: string;
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
        })),
      );
    };
    void load();
  }, [ready]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Projects</ThemedText>
      {!ready ? (
        <ThemedText>Loading projects...</ThemedText>
      ) : projects.length === 0 ? (
        <ThemedText>No projects yet.</ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          {projects.map((project) => (
            <ThemedView key={project.id} style={styles.card}>
              <ThemedText type="defaultSemiBold">{project.name}</ThemedText>
              <ThemedText>{project.key}</ThemedText>
              <ThemedText>{project.type}</ThemedText>
              <Link href={`/project/${project.id}`}>
                <ThemedText type="link">Open project</ThemedText>
              </Link>
            </ThemedView>
          ))}
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
  container: {
    gap: 12,
    padding: 24,
  },
  list: {
    gap: 12,
  },
});
