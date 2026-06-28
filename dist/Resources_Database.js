/**
 * Resources_Database.js — Live DB registry, backups, restore, and multi-step revert.
 */

const DB_OPS_LOG_SHEET = 'DB_Operations_Log';
const DB_OPS_HEADERS = [
  'step_id', 'timestamp', 'actor', 'operation', 'file_type',
  'prev_live_id', 'prev_live_name', 'replaced_file_id', 'new_live_id',
  'backup_source_id', 'status', 'notes'
];

function assertRootDbAccess(actor) {
  if (!verifyBackendPrivilege(actor, 'ROOT')) {
    throw new Error('ROOT privileges required for database operations.');
  }
}

function setBackupInProgress_() {
  PropertiesService.getScriptProperties().setProperty('BACKUP_IN_PROGRESS', String(Date.now()));
}

function clearBackupInProgress_() {
  PropertiesService.getScriptProperties().deleteProperty('BACKUP_IN_PROGRESS');
}

function isBackupInProgress_() {
  return !!PropertiesService.getScriptProperties().getProperty('BACKUP_IN_PROGRESS');
}

function beginDatabaseBackupLock(actor) {
  return executeWithRetry(() => {
    if (actor) assertRootDbAccess(actor);
    setBackupInProgress_();
    return 'Backup lock engaged — database writes blocked until backup completes.';
  });
}

function endDatabaseBackupLock(actor) {
  return executeWithRetry(() => {
    if (actor) assertRootDbAccess(actor);
    clearBackupInProgress_();
    return 'Backup lock released.';
  });
}

function dbOpsTimestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function getDatabaseBackupFolder() {
  const rootDrive = DriveApp.getFolderById(SYSTEM_ROOT_ID);
  const folders = rootDrive.getFoldersByName(DB_BACKUP_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : rootDrive.createFolder(DB_BACKUP_FOLDER_NAME);
}

function getReplacedDatabaseFolder() {
  return DriveApp.getFolderById(REPLACED_DB_FOLDER_ID);
}

const BACKUP_TZ = 'Europe/Sofia';
const BACKUP_RETAIN_DAYS = 30;

function getBackupDateLabel_() {
  return Utilities.formatDate(new Date(), BACKUP_TZ, 'yyyy-MM-dd');
}

function getYesterdayBackupDateLabel_() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return Utilities.formatDate(d, BACKUP_TZ, 'yyyy-MM-dd');
}

function parseBackupDateFromFilename_(name) {
  const m = String(name).match(/^(?:ENGINE|VAULT)_BACKUP_(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function verifyBackupFileInFolder_(folder, expectedName) {
  const it = folder.getFilesByName(expectedName);
  if (!it.hasNext()) {
    throw new Error('Backup verification failed — file not found in Drive: ' + expectedName);
  }
  const f = it.next();
  return { id: f.getId(), name: f.getName() };
}

function pruneOldBackupsSafely_(folder, retainDays) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (retainDays || BACKUP_RETAIN_DAYS));
  const errors = [];
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    try {
      if (file.getDateCreated() < cutoff) file.setTrashed(true);
    } catch (e) {
      errors.push(file.getName() + ': ' + e.message);
    }
  }
  return errors;
}

function scanBackupFolderInventory_() {
  const folder = getDatabaseBackupFolder();
  const engineByDate = {};
  const vaultByDate = {};
  let fileCount = 0;

  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    fileCount++;
    const name = f.getName();
    const date = parseBackupDateFromFilename_(name);
    if (!date) continue;
    const entry = {
      id: f.getId(),
      name: name,
      date: date,
      modified: f.getLastUpdated().getTime(),
      modifiedLabel: Utilities.formatDate(f.getLastUpdated(), BACKUP_TZ, 'yyyy-MM-dd HH:mm')
    };
    if (name.indexOf('ENGINE_BACKUP_') === 0) {
      if (!engineByDate[date] || entry.modified > engineByDate[date].modified) engineByDate[date] = entry;
    } else if (name.indexOf('VAULT_BACKUP_') === 0) {
      if (!vaultByDate[date] || entry.modified > vaultByDate[date].modified) vaultByDate[date] = entry;
    }
  }

  const paired = [];
  Object.keys(engineByDate).forEach(function(d) {
    if (vaultByDate[d]) {
      paired.push({ date: d, engine: engineByDate[d], vault: vaultByDate[d] });
    }
  });
  paired.sort(function(a, b) { return b.date.localeCompare(a.date); });

  const engineOnly = Object.keys(engineByDate).filter(function(d) { return !vaultByDate[d]; });
  const vaultOnly = Object.keys(vaultByDate).filter(function(d) { return !engineByDate[d]; });

  let lastEngine = null;
  let lastVault = null;
  Object.keys(engineByDate).sort().reverse().forEach(function(d, i, arr) {
    if (!lastEngine) lastEngine = { date: d, file: engineByDate[d] };
  });
  Object.keys(vaultByDate).sort().reverse().forEach(function(d) {
    if (!lastVault) lastVault = { date: d, file: vaultByDate[d] };
  });

  return {
    fileCount: fileCount,
    paired: paired,
    lastPaired: paired[0] || null,
    lastEngine: lastEngine,
    lastVault: lastVault,
    engineOnlyDates: engineOnly,
    vaultOnlyDates: vaultOnly
  };
}

function computeBackupHealthReport_() {
  const inv = scanBackupFolderInventory_();
  const todayLocal = getBackupDateLabel_();
  const yesterdayLocal = getYesterdayBackupDateLabel_();
  const props = PropertiesService.getScriptProperties();
  const propsLastDate = props.getProperty('LAST_BACKUP_DATE') || null;

  const lastPairedDate = inv.lastPaired ? inv.lastPaired.date : null;
  let daysSincePaired = null;
  if (lastPairedDate) {
    const a = new Date(lastPairedDate + 'T12:00:00');
    const b = new Date(todayLocal + 'T12:00:00');
    daysSincePaired = Math.round((b - a) / 86400000);
  }

  // Healthy = Engine+Vault pair exists for today OR yesterday (covers last night's run)
  const healthy = lastPairedDate === todayLocal || lastPairedDate === yesterdayLocal;
  const propsMismatch = propsLastDate && lastPairedDate && propsLastDate !== lastPairedDate;

  let warning = null;
  if (!lastPairedDate) {
    warning = 'No paired Engine+Vault backups found in 05_DATABASE_BACKUPS.';
  } else if (!healthy) {
    warning = 'Last successful paired backup is ' + lastPairedDate + ' (' + daysSincePaired + ' day(s) ago). Expected ' + yesterdayLocal + ' or ' + todayLocal + '.';
  } else if (inv.engineOnlyDates.length || inv.vaultOnlyDates.length) {
    warning = 'Some backup dates are missing a pair (Engine-only or Vault-only days detected).';
  }
  if (propsMismatch) {
    warning = (warning ? warning + ' ' : '') + 'Script property LAST_BACKUP_DATE (' + propsLastDate + ') does not match newest files (' + lastPairedDate + ') — trusting Drive files.';
  }

  return {
    healthy: healthy && !inv.engineOnlyDates.length && !inv.vaultOnlyDates.length,
    warning: warning,
    todayLocal: todayLocal,
    yesterdayLocal: yesterdayLocal,
    lastPairedDate: lastPairedDate,
    daysSincePaired: daysSincePaired,
    propsLastBackupDate: propsLastDate,
    propsMismatch: propsMismatch,
    fileCount: inv.fileCount,
    lastPaired: inv.lastPaired,
    lastEngineDate: inv.lastEngine ? inv.lastEngine.date : null,
    lastVaultDate: inv.lastVault ? inv.lastVault.date : null,
    engineOnlyDates: inv.engineOnlyDates,
    vaultOnlyDates: inv.vaultOnlyDates
  };
}

function getDatabaseBackupHealth(actor) {
  return executeWithRetry(() => {
    if (actor) assertRootDbAccess(actor);
    return computeBackupHealthReport_();
  });
}

function runVerifiedNightlyBackup_(forceManual, actor) {
  const props = PropertiesService.getScriptProperties();
  const todayStr = getBackupDateLabel_();
  const lastBackup = props.getProperty('LAST_BACKUP_DATE');

  if (!forceManual && lastBackup === todayStr) {
    const health = computeBackupHealthReport_();
    if (health.lastPairedDate === todayStr) {
      return 'Backup already completed for today (verified in Drive).';
    }
  }

  const folder = getDatabaseBackupFolder();
  const timeStamp = forceManual ? '_' + new Date().getTime() : '';
  const engineName = 'ENGINE_BACKUP_' + todayStr + timeStamp;
  const vaultName = 'VAULT_BACKUP_' + todayStr + timeStamp;

  const engineFile = DriveApp.getFileById(getEngineSheetId());
  const vaultFile = DriveApp.getFileById(getVaultSheetId());

  engineFile.makeCopy(engineName, folder);
  vaultFile.makeCopy(vaultName, folder);

  const engVerified = verifyBackupFileInFolder_(folder, engineName);
  const vaultVerified = verifyBackupFileInFolder_(folder, vaultName);

  const pruneErrors = pruneOldBackupsSafely_(folder, BACKUP_RETAIN_DAYS);

  props.setProperty('LAST_BACKUP_DATE', todayStr);
  props.deleteProperty('BACKUP_HEALTH_ALERT');

  const who = actor || 'System';
  writeToAuditLog(who, 'BACKUP', 'DATABASE', 'GLOBAL', 'Nightly',
    'Verified pair ' + engineName + ' + ' + vaultName + (pruneErrors.length ? ' | prune warnings: ' + pruneErrors.join('; ') : ''));

  let msg = 'Backup verified in Drive: ' + engineName + ' + ' + vaultName;
  if (pruneErrors.length) msg += ' (some old files could not be deleted — backup still OK)';
  return msg;
}

function runDailyBackupHealthCheck() {
  return executeWithRetry(() => {
    const health = computeBackupHealthReport_();
    const props = PropertiesService.getScriptProperties();
    if (!health.healthy) {
      props.setProperty('BACKUP_HEALTH_ALERT', JSON.stringify({
        at: new Date().toISOString(),
        warning: health.warning,
        lastPairedDate: health.lastPairedDate
      }));
      writeToAuditLog('System', 'WARNING', 'DATABASE', 'GLOBAL', 'Backup Failsafe', health.warning);
      return health.warning;
    }
    props.deleteProperty('BACKUP_HEALTH_ALERT');
    return 'Backup health OK — last pair: ' + health.lastPairedDate;
  });
}

function setupNightlyBackupTriggers() {
  const handlers = ['runNightlyBackup', 'runDailyBackupHealthCheck'];
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (handlers.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runNightlyBackup')
    .timeBased().atHour(2).nearMinute(15).everyDays(1).inTimezone(BACKUP_TZ).create();
  ScriptApp.newTrigger('runDailyBackupHealthCheck')
    .timeBased().atHour(7).nearMinute(0).everyDays(1).inTimezone(BACKUP_TZ).create();
  return 'Nightly backup (02:15) and health check (07:00) installed — ' + BACKUP_TZ;
}

function getDbFileTypeMeta(fileType) {
  const t = String(fileType || '').toUpperCase();
  if (t === 'ENGINE') {
    return {
      type: 'ENGINE',
      prefix: 'ENGINE_',
      backupPrefix: 'ENGINE_BACKUP_',
      liveName: LIVE_ENGINE_FILE_NAME,
      propKey: 'ACTIVE_ENGINE_SHEET_ID',
      fallbackId: ENGINE_SHEET_ID,
      getter: getEngineSheetId
    };
  }
  if (t === 'VAULT') {
    return {
      type: 'VAULT',
      prefix: 'VAULT_',
      backupPrefix: 'VAULT_BACKUP_',
      liveName: LIVE_VAULT_FILE_NAME,
      propKey: 'ACTIVE_VAULT_SHEET_ID',
      fallbackId: VAULT_SHEET_ID,
      getter: getVaultSheetId
    };
  }
  throw new Error('file_type must be ENGINE or VAULT');
}

function getFileParentFolderId_(file) {
  const parents = file.getParents();
  return parents.hasNext() ? parents.next().getId() : '';
}

function getFileParentFolderName_(file) {
  const parents = file.getParents();
  return parents.hasNext() ? parents.next().getName() : '(root)';
}

function findFileByNameInFolder_(folder, name) {
  const it = folder.getFilesByName(name);
  return it.hasNext() ? it.next() : null;
}

function clearCanonicalLiveSlot_(canonicalFolder, meta, replacedFolder, ts, keepId) {
  const slot = findFileByNameInFolder_(canonicalFolder, meta.liveName);
  if (!slot || slot.getId() === keepId) return '';
  slot.setName(meta.prefix + 'STALE_SLOT_' + ts);
  slot.moveTo(replacedFolder);
  return slot.getId();
}

function moveLiveFileToReplaced_(liveFile, meta, replacedFolder, ts) {
  const prevName = liveFile.getName();
  liveFile.setName(meta.prefix + 'REPLACED_' + ts);
  liveFile.moveTo(replacedFolder);
  return { prevName: prevName, replacedFileId: liveFile.getId() };
}

function placeFileAsCanonicalLive_(file, meta, canonicalFolder) {
  if (file.getName() !== meta.liveName) file.setName(meta.liveName);
  if (getFileParentFolderId_(file) !== canonicalFolder.getId()) file.moveTo(canonicalFolder);
  return file.getId();
}

function verifyDbOperationsLogSchema() {
  const ss = SpreadsheetApp.openById(getAuditLogSheetId());
  let sheet = ss.getSheetByName(DB_OPS_LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DB_OPS_LOG_SHEET);
    sheet.appendRow(DB_OPS_HEADERS);
    sheet.getRange(1, 1, 1, DB_OPS_HEADERS.length)
      .setFontWeight('bold').setBackground('#b45309').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(DB_OPS_HEADERS);
    sheet.getRange(1, 1, 1, DB_OPS_HEADERS.length)
      .setFontWeight('bold').setBackground('#b45309').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readDbOperationsLog() {
  const sheet = verifyDbOperationsLogSchema();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const map = {};
  data[0].forEach((h, i) => { map[String(h).trim()] = i; });
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[map.step_id]) continue;
    rows.push({
      step_id: String(r[map.step_id]),
      timestamp: r[map.timestamp] ? String(r[map.timestamp]) : '',
      actor: String(r[map.actor] || ''),
      operation: String(r[map.operation] || ''),
      file_type: String(r[map.file_type] || ''),
      prev_live_id: String(r[map.prev_live_id] || ''),
      prev_live_name: String(r[map.prev_live_name] || ''),
      replaced_file_id: String(r[map.replaced_file_id] || ''),
      new_live_id: String(r[map.new_live_id] || ''),
      backup_source_id: String(r[map.backup_source_id] || ''),
      status: String(r[map.status] || ''),
      notes: String(r[map.notes] || ''),
      rowIndex: i + 1
    });
  }
  return rows;
}

function nextDbOperationStepId() {
  const rows = readDbOperationsLog();
  let max = 0;
  rows.forEach((r) => {
    const n = parseInt(r.step_id, 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return String(max + 1);
}

function appendDbOperationLog(entry) {
  const sheet = verifyDbOperationsLogSchema();
  sheet.appendRow([
    entry.step_id,
    entry.timestamp || new Date().toISOString(),
    entry.actor || 'System',
    entry.operation,
    entry.file_type,
    entry.prev_live_id || '',
    entry.prev_live_name || '',
    entry.replaced_file_id || '',
    entry.new_live_id || '',
    entry.backup_source_id || '',
    entry.status || 'ACTIVE',
    entry.notes || ''
  ]);
}

function markDbOperationStatus(stepId, status) {
  const sheet = verifyDbOperationsLogSchema();
  const rows = readDbOperationsLog();
  const hit = rows.find((r) => r.step_id === String(stepId));
  if (!hit) return;
  const data = sheet.getDataRange().getValues();
  const map = {};
  data[0].forEach((h, i) => { map[String(h).trim()] = i; });
  sheet.getRange(hit.rowIndex, map.status + 1).setValue(status);
}

function supersedeActiveDbOps(fileType) {
  readDbOperationsLog().forEach((r) => {
    if (r.file_type === fileType && r.status === 'ACTIVE' && r.operation === 'RESTORE') {
      markDbOperationStatus(r.step_id, 'SUPERSEDED');
    }
  });
}

function listBackupFiles_(fileType) {
  const meta = getDbFileTypeMeta(fileType);
  const folder = getDatabaseBackupFolder();
  const out = [];
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    const name = f.getName();
    if (!name.startsWith(meta.backupPrefix)) continue;
    out.push({
      id: f.getId(),
      name: name,
      modified: f.getLastUpdated().getTime(),
      modifiedLabel: f.getLastUpdated().toISOString()
    });
  }
  out.sort((a, b) => b.modified - a.modified);
  return out;
}

function describeLiveFile_(fileId) {
  try {
    const f = DriveApp.getFileById(fileId);
    return {
      id: f.getId(),
      name: f.getName(),
      modified: f.getLastUpdated().getTime(),
      modifiedLabel: f.getLastUpdated().toISOString(),
      url: f.getUrl()
    };
  } catch (e) {
    return { id: fileId, name: '(missing)', modified: 0, modifiedLabel: '', url: '' };
  }
}

function describeLiveFileDetail_(fileId, fileType) {
  const meta = getDbFileTypeMeta(fileType);
  const canonicalFolder = getLiveDatabaseFolder();
  const base = describeLiveFile_(fileId);
  let parentFolderName = '';
  let parentFolderId = '';
  let inCanonicalFolder = false;
  let hasCanonicalName = false;
  try {
    const f = DriveApp.getFileById(fileId);
    parentFolderId = getFileParentFolderId_(f);
    parentFolderName = getFileParentFolderName_(f);
    inCanonicalFolder = parentFolderId === canonicalFolder.getId();
    hasCanonicalName = f.getName() === meta.liveName;
  } catch (e) { /* ignore */ }
  return Object.assign({}, base, {
    parentFolderName: parentFolderName,
    parentFolderId: parentFolderId,
    inCanonicalFolder: inCanonicalFolder,
    hasCanonicalName: hasCanonicalName,
    layoutOk: inCanonicalFolder && hasCanonicalName,
    canonicalFolderName: LIVE_DATABASE_FOLDER_NAME,
    canonicalFolderUrl: canonicalFolder.getUrl(),
    expectedPath: LIVE_DATABASE_FOLDER_NAME + '/' + meta.liveName,
    originalFactoryId: meta.fallbackId,
    isOriginalFactoryFile: fileId === meta.fallbackId
  });
}

function getLiveDatabaseStatus(actor) {
  return executeWithRetry(() => {
    assertRootDbAccess(actor);
    const canonicalFolder = getLiveDatabaseFolder();
    return {
      engine: describeLiveFileDetail_(getEngineSheetId(), 'ENGINE'),
      vault: describeLiveFileDetail_(getVaultSheetId(), 'VAULT'),
      canonicalFolder: {
        name: LIVE_DATABASE_FOLDER_NAME,
        id: canonicalFolder.getId(),
        url: canonicalFolder.getUrl()
      },
      backups: {
        engine: listBackupFiles_('ENGINE').slice(0, 50),
        vault: listBackupFiles_('VAULT').slice(0, 50)
      },
      health: computeBackupHealthReport_(),
      operations: readDbOperationsLog()
        .filter((r) => r.status === 'ACTIVE' || r.status === 'REVERTED')
        .sort((a, b) => parseInt(b.step_id, 10) - parseInt(a.step_id, 10))
        .slice(0, 20)
    };
  });
}

function repairOneCanonicalLive_(fileType) {
  const meta = getDbFileTypeMeta(fileType);
  const liveId = meta.getter();
  const canonicalFolder = getLiveDatabaseFolder();
  const replacedFolder = getReplacedDatabaseFolder();
  const ts = dbOpsTimestampSlug();
  const liveFile = DriveApp.getFileById(liveId);
  const beforeName = liveFile.getName();
  const beforeParent = getFileParentFolderName_(liveFile);
  clearCanonicalLiveSlot_(canonicalFolder, meta, replacedFolder, ts, liveId);
  const afterId = placeFileAsCanonicalLive_(liveFile, meta, canonicalFolder);
  setActiveSheetId(meta.propKey, afterId);
  return {
    fileType: meta.type,
    liveId: afterId,
    beforeName: beforeName,
    beforeParent: beforeParent,
    afterName: meta.liveName,
    afterFolder: LIVE_DATABASE_FOLDER_NAME,
    layoutOk: true
  };
}

function repairLiveDatabaseLayout(actor) {
  return executeWithRetry(() => {
    assertRootDbAccess(actor);
    const results = ['ENGINE', 'VAULT'].map((t) => repairOneCanonicalLive_(t));
    cachedEngineSheets = null;
    cachedVaultSheets = null;
    flushCache();
    writeToAuditLog(actor, 'REPAIR', 'DATABASE', 'GLOBAL', 'Layout',
      results.map((r) => r.fileType + ': ' + r.beforeName + ' @ ' + r.beforeParent + ' → ' + r.afterFolder + '/' + r.afterName).join(' | '));
    return {
      results: results,
      message: 'Live files moved to ' + LIVE_DATABASE_FOLDER_NAME + '/ENGINE and /VAULT. Hard-refresh the app.'
    };
  });
}

function backupDatabaseFileCore_(actor, fileType) {
  assertRootDbAccess(actor);
  const meta = getDbFileTypeMeta(fileType);
  const liveId = meta.getter();
  const liveFile = DriveApp.getFileById(liveId);
  const folder = getDatabaseBackupFolder();
  const todayStr = getBackupDateLabel_();
  const copyName = meta.backupPrefix + todayStr + '_' + Date.now();
  liveFile.makeCopy(copyName, folder);
  verifyBackupFileInFolder_(folder, copyName);
  writeToAuditLog(actor, 'BACKUP', 'DATABASE', 'GLOBAL', meta.type, 'Verified in Drive: ' + copyName);
  flushCache();
  return 'Backup verified in Drive: ' + copyName;
}

function backupDatabaseFile(actor, fileType) {
  return executeWithRetry(() => backupDatabaseFileCore_(actor, fileType));
}

function backupDatabaseBoth(actor) {
  return executeWithRetry(() => {
    assertRootDbAccess(actor);
    const e = backupDatabaseFileCore_(actor, 'ENGINE');
    const v = backupDatabaseFileCore_(actor, 'VAULT');
    PropertiesService.getScriptProperties().setProperty('LAST_BACKUP_DATE', getBackupDateLabel_());
    return e + '\n' + v;
  });
}

function restoreDatabaseFromBackup(actor, fileType, backupFileId) {
  return executeWithRetry(() => {
    assertRootDbAccess(actor);
    if (!backupFileId) throw new Error('Select a backup file first.');

    const meta = getDbFileTypeMeta(fileType);
    const prevLiveId = meta.getter();
    const prevLiveFile = DriveApp.getFileById(prevLiveId);
    const backupFile = DriveApp.getFileById(backupFileId);
    const backupName = backupFile.getName();
    if (!backupName.startsWith(meta.backupPrefix)) {
      throw new Error('Selected file is not a valid ' + meta.type + ' backup.');
    }

    const ts = dbOpsTimestampSlug();
    const replacedFolder = getReplacedDatabaseFolder();
    const canonicalFolder = getLiveDatabaseFolder();
    const prev = moveLiveFileToReplaced_(prevLiveFile, meta, replacedFolder, ts);
    clearCanonicalLiveSlot_(canonicalFolder, meta, replacedFolder, ts, null);

    const newLiveFile = backupFile.makeCopy(meta.liveName, canonicalFolder);
    const newLiveId = newLiveFile.getId();

    setActiveSheetId(meta.propKey, newLiveId);
    cachedEngineSheets = null;
    cachedVaultSheets = null;
    flushCache();

    supersedeActiveDbOps(meta.type);
    const stepId = nextDbOperationStepId();
    appendDbOperationLog({
      step_id: stepId,
      actor: actor,
      operation: 'RESTORE',
      file_type: meta.type,
      prev_live_id: prevLiveId,
      prev_live_name: prev.prevName,
      replaced_file_id: prev.replacedFileId,
      new_live_id: newLiveId,
      backup_source_id: backupFileId,
      status: 'ACTIVE',
      notes: `Restored from ${backupName} → ${LIVE_DATABASE_FOLDER_NAME}/${meta.liveName}`
    });

    writeToAuditLog(actor, 'RESTORE', 'DATABASE', 'GLOBAL', meta.type,
      `Live ${prev.prevName} (${prevLiveId}) → Replaced; backup ${backupName} → ${LIVE_DATABASE_FOLDER_NAME}/${meta.liveName} (${newLiveId})`);

    return `RESTORE complete for ${meta.type}. Live file: ${LIVE_DATABASE_FOLDER_NAME}/${meta.liveName}. Previous live moved to Replaced folder. Hard-refresh the app.`;
  });
}

function revertDatabaseOperation(actor, stepId) {
  return executeWithRetry(() => {
    assertRootDbAccess(actor);
    if (!stepId) throw new Error('Select an operation step to revert.');

    const rows = readDbOperationsLog();
    const row = rows.find((r) => r.step_id === String(stepId));
    if (!row) throw new Error('Operation step not found.');
    if (row.operation !== 'RESTORE') throw new Error('Only RESTORE steps can be reverted.');
    if (row.status !== 'ACTIVE') throw new Error('This step is not reversible (status: ' + row.status + ').');

    const meta = getDbFileTypeMeta(row.file_type);
    const currentLiveId = meta.getter();
    const replacedFileId = row.replaced_file_id;
    if (!replacedFileId) throw new Error('Missing replaced file reference for this step.');

    const ts = dbOpsTimestampSlug();
    const replacedFolder = getReplacedDatabaseFolder();
    const canonicalFolder = getLiveDatabaseFolder();

    let mistakenLiveFile = null;
    let mistakenName = '';
    try {
      mistakenLiveFile = DriveApp.getFileById(currentLiveId);
      mistakenName = mistakenLiveFile.getName();
    } catch (e) { /* ignore */ }

    let mistakenReplacedId = '';
    if (mistakenLiveFile && mistakenLiveFile.getId() !== replacedFileId) {
      mistakenLiveFile.setName(meta.prefix + 'SUPERSEDED_' + ts);
      mistakenLiveFile.moveTo(replacedFolder);
      mistakenReplacedId = mistakenLiveFile.getId();
    }

    clearCanonicalLiveSlot_(canonicalFolder, meta, replacedFolder, ts, replacedFileId);
    const restoredFile = DriveApp.getFileById(replacedFileId);
    const restoredLiveId = placeFileAsCanonicalLive_(restoredFile, meta, canonicalFolder);

    setActiveSheetId(meta.propKey, restoredLiveId);
    cachedEngineSheets = null;
    cachedVaultSheets = null;
    flushCache();

    markDbOperationStatus(row.step_id, 'REVERTED');
    const newStepId = nextDbOperationStepId();
    appendDbOperationLog({
      step_id: newStepId,
      actor: actor,
      operation: 'REVERT',
      file_type: meta.type,
      prev_live_id: currentLiveId,
      prev_live_name: mistakenName,
      replaced_file_id: mistakenReplacedId,
      new_live_id: restoredLiveId,
      backup_source_id: row.step_id,
      status: 'ACTIVE',
      notes: `Reverted restore step #${row.step_id} → ${LIVE_DATABASE_FOLDER_NAME}/${meta.liveName}`
    });

    writeToAuditLog(actor, 'REVERT', 'DATABASE', 'GLOBAL', meta.type,
      `Reverted step ${row.step_id}; live is ${LIVE_DATABASE_FOLDER_NAME}/${meta.liveName} (${restoredLiveId})`);

    return `REVERT complete for ${meta.type}. Live file: ${LIVE_DATABASE_FOLDER_NAME}/${meta.liveName}. Hard-refresh the app.`;
  });
}

function listDatabaseBackups(actor, fileType) {
  return executeWithRetry(() => {
    assertRootDbAccess(actor);
    return listBackupFiles_(fileType);
  });
}
