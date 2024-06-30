const jsAndOajsFiles = ["scripts/**/*.{js,oajs}"];

module.exports = [
  {
    ignores: ["node_modules/**", "dist/**"],
    files: jsAndOajsFiles,
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: "module",
      globals: {
        browser: true,
        node: true
      }
    },
    rules: {
      "prefer-const": "warn",
      "no-const-assign": "error",
      "no-unused-vars": ["error", { "vars": "all", "args": "none" }],
      "indent": ["warn", "tab"],
      "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
      "comma-dangle": ["error", "never"],
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "no-restricted-syntax": [
        "error",
        {
          "selector": "VariableDeclaration[kind='let']",
          "message": "Use 'var' or 'const' instead of 'let'."
        }
      ]
    }
  }
];
