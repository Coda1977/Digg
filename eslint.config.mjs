import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  {
    ignores: ["convex/_generated/**", "set-env.js"],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default config;
