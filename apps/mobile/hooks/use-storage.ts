import { useEffect, useState } from "react";

import { checkIfDatabaseIsSeeded, seedDatabase } from "@repo/storage";

export const useStorageReady = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const isSeeded = await checkIfDatabaseIsSeeded();
      if (!isSeeded) {
        await seedDatabase();
      }
      if (active) setReady(true);
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return ready;
};
