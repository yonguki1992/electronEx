module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended" // TypeScript 권장 규칙
    ],
    rules: {
        "@typescript-eslint/no-unused-vars": ["warn"], // 사용되지 않는 변수 경고
        "@typescript-eslint/no-explicit-any": "error", // any 사용 금지
        "no-console": "warn" // console.log 경고
    }
};
