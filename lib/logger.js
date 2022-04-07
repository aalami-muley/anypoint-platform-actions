"use strict";

let core;
try {
    core = require('@actions/core');
    module.exports = {
        "info": core.info,
        "warn": core.warning,
        "error": core.error
    }
} catch (error) {
    const chalk = require('chalk');
    const log = console.log;

    module.exports = {
        debug(message) {
            log(chalk.blue("debug - " + message));
        },
        info(message) {
            log(chalk.green("info - " + message));
        },
        warn(message) {
            log(chalk.yellow("warn - " + message));
        },
        error(message) {
            log(chalk.red("error - " + message));
        }
    }
}