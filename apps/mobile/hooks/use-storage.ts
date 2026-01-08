import { useEffect, useState } from "react";

import { checkIfDatabaseIsSeeded } from "@repo/storage";

export const useStorageReady = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      await checkIfDatabaseIsSeeded();
      if (active) setReady(true);
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return ready;
};
