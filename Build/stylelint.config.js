/* eslint-disable no-undef */
"use strict"
/*
    Angepasste Stylelint-Config und -Regeln
    Übersicht aller Stylelint Regeln -> https://stylelint.io/user-guide/rules/list
*/
module.exports = { // eslint-disable-line no-undef
    "extends": [
        "stylelint-config-recommended", // contains these rules: https://github.com/stylelint/stylelint-config-recommended/blob/master/index.js
        "stylelint-config-recommended-scss", // contains these rules: https://github.com/kristerkari/stylelint-config-recommended-scss/blob/master/index.js
        "stylelint-config-standard" // contains these rules: https://github.com/stylelint/stylelint-config-standard/blob/master/index.js
    ],
    "plugins": [
        "stylelint-scss", // see https://github.com/kristerkari/stylelint-scss
        "stylelint-order" // see https://github.com/hudochenkov/stylelint-order
    ],
    "ignoreFiles": ["**/*.html", "**/*.js", "**/*.php"],
    "rules": {
        "at-rule-empty-line-before": [
            "always", {
                "except": ["first-nested", "blockless-after-blockless"],
                "ignore": "after-comment"
            }],
        "max-empty-lines": 1,
        "at-rule-no-unknown": null,
        "scss/at-rule-no-unknown": true,
        "block-no-empty": true,
        "color-function-notation": "modern",
        "block-closing-brace-newline-after": "always-single-line",
        "declaration-block-no-shorthand-property-overrides": true,
        "declaration-colon-newline-after": "always-multi-line",
        "declaration-empty-line-before": null,
        "font-family-no-missing-generic-family-keyword": true,
        "function-comma-newline-after": null,
        "function-parentheses-newline-inside": null,
        'function-url-quotes': null,
        "no-descending-specificity": null,
        "number-leading-zero": "never",
        'scss/comment-no-empty': null,
        'scss/at-if-no-null': null,
        'keyframes-name-pattern': null,
        'declaration-block-no-redundant-longhand-properties': null,
        "selector-type-no-unknown": [true, {"severity": "warning"}],
        "property-no-vendor-prefix": [
            true, {
            ignoreProperties: ["backface-visibility", "appearance"]
        }],
        "selector-id-pattern": null,
    }
}
