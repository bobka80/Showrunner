#!/usr/bin/env node
/**
 * CLI entry — implementation in pre-ship/index.js
 * Usage: node pre-ship.js [--layers gas[,hosting]] [--dry-run] [--deploy]
 */
const { main } = require('./pre-ship/index.js');
main();
