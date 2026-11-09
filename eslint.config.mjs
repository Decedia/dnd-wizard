import Module from "node:module";

// TypeScript 7 no longer ships the JavaScript compiler API that
// typescript-eslint needs (it supports TypeScript < 6.1). Point only
// typescript-eslint's (and ts-api-utils') `require("typescript")` at the TypeScript 6 copy
// installed as `typescript-eslint-compiler`; tsc and the build keep TS 7.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === "typescript" && /typescript-eslint|ts-api-utils/.test(parent?.filename ?? "")) {
    return originalResolve.call(this, "typescript-eslint-compiler", parent, ...rest);
  }
  return originalResolve.call(this, request, parent, ...rest);
};

const { default: nextConfig } = await import("eslint-config-next");

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["node_modules/**", "scripts/**"],
  },
];

export default eslintConfig;
