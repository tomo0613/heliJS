const DISABLED = 0;
const WARNING = 1;
const ERROR = 2;

const importOrder_ruleConfig = {
    'groups': ['builtin', 'external', 'internal'],
    'alphabetize': {
        order: 'asc',
        caseInsensitive: true,
    },
    'newlines-between': 'always',
};

const noMixedOperators_ruleConfig = {
    allowSamePrecedence: true,
    groups: [
        ['%', '**'],
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof'],
    ],
};

module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    env: {
        browser: true,
        node: true,
    },
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'airbnb-base',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        "@typescript-eslint/camelcase": DISABLED,
        "@typescript-eslint/explicit-function-return-type": DISABLED,
        "@typescript-eslint/explicit-member-accessibility": DISABLED,
        "@typescript-eslint/explicit-module-boundary-types": DISABLED,
        "@typescript-eslint/member-delimiter-style": ERROR,
        "@typescript-eslint/no-empty-function": WARNING,
        "@typescript-eslint/no-shadow": ERROR,
        "@typescript-eslint/no-use-before-define": [ERROR, "nofunc"],
        "brace-style": [ERROR, "1tbs", { allowSingleLine: false }],
        "camelcase": DISABLED,
        "curly": [ERROR, "all"],
        "func-names": [WARNING, "as-needed"],
        "import/extensions": [ERROR, "never"],
        "import/no-unresolved": DISABLED,
        "import/order": [WARNING, importOrder_ruleConfig],
        "import/prefer-default-export": DISABLED,
        "indent": [WARNING, 4, { SwitchCase: 1 }],
        "linebreak-style": DISABLED,
        "lines-between-class-members": [1, "always", { exceptAfterSingleLine: true }],
        "max-len": [WARNING, 120],
        "no-continue": DISABLED,
        "no-dupe-class-members": DISABLED,
        "no-mixed-operators": [WARNING, noMixedOperators_ruleConfig],
        "no-multi-spaces": WARNING,
        "no-multiple-empty-lines": [ERROR, { max: 1 }],
        "no-param-reassign": DISABLED,
        "no-plusplus": DISABLED,
        "no-prototype-builtins": DISABLED,
        "no-shadow": DISABLED,
        "no-underscore-dangle": DISABLED,
        "no-use-before-define": DISABLED,
        "object-curly-newline": DISABLED,
        "quote-props": [WARNING, "consistent-as-needed", { numbers: true }],
        "sort-imports": DISABLED,
        "wrap-iife": DISABLED,
      },
};