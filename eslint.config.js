module.exports = [
  {
    ignores: ["assets/vendor/**"]
  },
  {
    files: ["assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        location: "readonly",
        navigator: "readonly",
        performance: "readonly",
        sessionStorage: "readonly",
        matchMedia: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        addEventListener: "readonly",
        innerWidth: "readonly",
        innerHeight: "readonly",
        devicePixelRatio: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "prefer-const": "error"
    }
  }
];
