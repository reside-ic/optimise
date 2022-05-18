module.exports = {
    "globals": {
        "ts-jest": {
            tsConfig: 'tsconfig.json',
            "diagnostics": {
                "warnOnly": false
            }
        }
    },
    "moduleFileExtensions": [
        "js",
        "json",
        "ts"
    ],
    "transform": {
        "^.+\\.ts?$": "ts-jest"
    },
    "coverageDirectory": "./coverage/",
    "collectCoverage": true,
    "coveragePathIgnorePatterns": [
        "/node_modules/"
    ]
};
