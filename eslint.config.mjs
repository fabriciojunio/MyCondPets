import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".vercel/**",
      "coverage/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // Hidratacao de tema/carrinho a partir de localStorage exige setState
      // no efeito de mount (nao ha como ler storage durante o render SSR).
      // Mantido como aviso para preservar visibilidade sem quebrar o build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
