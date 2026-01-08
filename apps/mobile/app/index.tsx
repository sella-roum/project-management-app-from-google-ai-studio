import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

const LOGIN_STATE_KEY = "isLoggedIn";
const APP_INITIALIZED_KEY = "appInitialized";
const HAS_SETUP_KEY = "hasSetup";

export default function Index() {
  const [checked, setChecked] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSetup, setHasSetup] = useState(false);

  useEffect(() => {
    let active = true;
    const loadLoginState = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          LOGIN_STATE_KEY,
          APP_INITIALIZED_KEY,
          HAS_SETUP_KEY,
        ]);
        if (!active) return;
        const values = new Map(entries);
        setIsLoggedIn(values.get(LOGIN_STATE_KEY) === "true");
        setInitialized(values.get(APP_INITIALIZED_KEY) === "true");
        setHasSetup(values.get(HAS_SETUP_KEY) === "true");
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    };

    void loadLoginState();

    return () => {
      active = false;
    };
  }, []);

  if (!checked) {
    return null;
  }

  if (!initialized) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!hasSetup) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
