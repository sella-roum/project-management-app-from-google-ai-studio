import assert from "node:assert/strict";
import { test } from "node:test";

const shouldRun = Boolean(process.env.RUN_STORAGE_PARITY_TESTS);

test(
  "storage adapters produce the same outputs for key scenarios",
  { skip: !shouldRun },
  async () => {
    const { DexieStorageAdapter } = await import(
      "../src/web/dexieStorageAdapter"
    );
    const { SQLiteStorageAdapter } = await import(
      "../src/mobile/sqliteStorageAdapter"
    );

    const web = new DexieStorageAdapter();
    const mobile = new SQLiteStorageAdapter({ dbName: "parity-test.db" });

    await web.seedDemo();
    await mobile.seedDemo();

    const webFilter = await web.saveFilter("My filter", "status = Done");
    const mobileFilter = await mobile.saveFilter("My filter", "status = Done");
    assert.equal(webFilter.name, mobileFilter.name);
    assert.equal(webFilter.query, mobileFilter.query);

    const webVersion = await web.createVersion({
      projectId: (await web.getProjects())[0]?.id ?? "",
      name: "v1.0",
    });
    const mobileVersion = await mobile.createVersion({
      projectId: (await mobile.getProjects())[0]?.id ?? "",
      name: "v1.0",
    });
    assert.equal(webVersion.name, mobileVersion.name);

    const webIssues = await web.getIssues();
    const mobileIssues = await mobile.getIssues();
    if (webIssues[0] && mobileIssues[0]) {
      await web.recordView(webIssues[0].id);
      await mobile.recordView(mobileIssues[0].id);
    }

    const [webRecent, mobileRecent] = await Promise.all([
      web.getRecentIssues(),
      mobile.getRecentIssues(),
    ]);
    assert.equal(webRecent.length, mobileRecent.length);

    const webProjectId = (await web.getProjects())[0]?.id ?? "";
    const mobileProjectId = (await mobile.getProjects())[0]?.id ?? "";
    const webEpic = await web.createIssue({
      projectId: webProjectId,
      title: "Epic issue",
      type: "Epic",
      status: "In Review",
      priority: "Highest",
    });
    const mobileEpic = await mobile.createIssue({
      projectId: mobileProjectId,
      title: "Epic issue",
      type: "Epic",
      status: "In Review",
      priority: "Highest",
    });
    assert.equal(webEpic.type, mobileEpic.type);
    assert.equal(webEpic.status, mobileEpic.status);
    assert.equal(webEpic.priority, mobileEpic.priority);

    const webLow = await web.createIssue({
      projectId: webProjectId,
      title: "Lowest priority task",
      type: "Task",
      status: "To Do",
      priority: "Lowest",
    });
    const mobileLow = await mobile.createIssue({
      projectId: mobileProjectId,
      title: "Lowest priority task",
      type: "Task",
      status: "To Do",
      priority: "Lowest",
    });
    assert.equal(webLow.priority, mobileLow.priority);
  },
);
