/**
 * Write last pre-ship report for AI / ship scripts (gitignored).
 */
const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'last-report.json');

function writeReport(report) {
  const payload = {
    ...report,
    writtenAt: new Date().toISOString(),
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return REPORT_PATH;
}

function readReport() {
  if (!fs.existsSync(REPORT_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

function printBugbotGate(bugbot, label) {
  console.log('\n── Bugbot gate ──');
  console.log(`Action: ${bugbot.action.toUpperCase()}`);
  if (bugbot.reasons && bugbot.reasons.length) {
    bugbot.reasons.forEach((r) => console.log(`  · ${r}`));
  }
  if (bugbot.action === 'require') {
    console.log('\nBUGBOT REQUIRED before this ship completes.');
    console.log('AI: launch Bugbot subagent on branch changes (see AI_DOCTRINE § Pre-ship Bugbot).');
    console.log('After Bugbot passes (no Critical/High blockers):');
    console.log('  set PRE_SHIP_BUGBOT_OK=1 and re-run the ship script.');
    console.log(`  Example: $env:PRE_SHIP_BUGBOT_OK=1; node ${label || 'milestone.js'} "…"`);
  } else if (bugbot.action === 'recommend') {
    console.log('\nBugbot RECOMMENDED — AI should run review before ship when session allows.');
  } else {
    console.log('\nBugbot skip — mechanical pre-ship is enough for this change set.');
  }
}

function assertBugbotCleared(bugbot, label) {
  if (!bugbot || bugbot.action !== 'require' || bugbot.alreadyCleared) return;
  printBugbotGate(bugbot, label);
  const err = new Error(
    'Pre-ship blocked: Bugbot review required. Run Bugbot, fix Critical/High findings, then PRE_SHIP_BUGBOT_OK=1'
  );
  err.code = 'BUGBOT_REQUIRED';
  throw err;
}

module.exports = { writeReport, readReport, printBugbotGate, assertBugbotCleared, REPORT_PATH };
