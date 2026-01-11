// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "node_modules/*", "../../node_modules/*"],
    settings: {
      "import/ignore": ["expo-document-picker"],
      "import/resolver": {
        node: {
          moduleDirectory: ["node_modules", "../../node_modules"],
        },
      },
    },
    rules: {
      "import/namespace": "off",
      "import/no-unresolved": "off",
    },
  },
]);
