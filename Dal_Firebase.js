/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Firebase.js - FirebaseAdapter seam (Phase 4 Slice A)
 *
 * Slice A: adapter exists and router can select it, but all methods delegate to SheetsAdapter
 * until client Firestore wiring + snapshot/commit APIs ship (Slice B+).
 *
 * Public Firebase config only — never store private keys in source control.
 */

// @INDEX: DAL -> Firebase adapter (Phase 4)

var __dalFirebaseAdapterSingleton = null;

function getFirebaseAdapter() {
  if (!__dalFirebaseAdapterSingleton) {
    __dalFirebaseAdapterSingleton = createFirebaseAdapter_();
  }
  return __dalFirebaseAdapterSingleton;
}

/**
 * Public web-app config from Script Properties (director sets in GAS project settings).
 */
function getFirebasePublicConfig() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('FIREBASE_API_KEY');
  if (!apiKey) {
    return { enabled: false };
  }
  return {
    enabled: true,
    apiKey: apiKey,
    authDomain: props.getProperty('FIREBASE_AUTH_DOMAIN') || '',
    projectId: props.getProperty('FIREBASE_PROJECT_ID') || '',
    storageBucket: props.getProperty('FIREBASE_STORAGE_BUCKET') || '',
    messagingSenderId: props.getProperty('FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: props.getProperty('FIREBASE_APP_ID') || ''
  };
}

function createFirebaseAdapter_() {
  var sheets = getSheetsAdapter();
  return {
    persistProjectAssetsDelta: function (projectId, deltas, actor) {
      return sheets.persistProjectAssetsDelta(projectId, deltas, actor);
    },
    fetchProjectAssets: function (projectId, startDateStr, endDateStr) {
      return sheets.fetchProjectAssets(projectId, startDateStr, endDateStr);
    },
    persistTimelineData: function (folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents) {
      return sheets.persistTimelineData(folderId, mode, shifts, crewUids, phases, overrides, clientTimestamp, actor, subEvents);
    },
    fetchTimelineData: function (folderId, mode) {
      return sheets.fetchTimelineData(folderId, mode);
    },
    persistOperationsBatch: function (projectId, batch, actor) {
      return sheets.persistOperationsBatch(projectId, batch, actor);
    },
    startOperationSession: function (projectId, operationType, actor) {
      return sheets.startOperationSession(projectId, operationType, actor);
    },
    finalizeOperationSession: function (projectId, actor) {
      return sheets.finalizeOperationSession(projectId, actor);
    },
    processRfidScanOp: function (projectId, rfidTag, actor) {
      return sheets.processRfidScanOp(projectId, rfidTag, actor);
    }
  };
}
