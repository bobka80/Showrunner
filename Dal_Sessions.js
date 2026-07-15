/**
 * SM Showrunner (smuruner) - Clean 8 Architecture
 * Dal_Sessions.js - DAL session registry (Phase 4 Slice A)
 *
 * Authoritative session flags live on Projects_Index. Firebase mirror comes in a later slice.
 * No session can open via UI yet — registry is read-only plumbing for the router.
 */

// @INDEX: DAL -> Session registry (Phase 4)

var DAL_SESSION_TYPE = {
  PREP: 'prep',
  TIMELINE_COLLAB: 'timelineCollab'
};

var DAL_SESSION_INDEX_COLS = [
  'Dal_Session_Type',
  'Dal_Session_Status',
  'Dal_Session_UID',
  'Dal_Session_Opened_At',
  'Dal_Session_Opened_By'
];

/**
 * Lazy-add session columns on Projects_Index (same pattern as Active_Operation).
 */
function dalEnsureSessionIndexColumns_(indexSheet, indexData) {
  var iMap = dalHeaderMapFromRows_(indexData[0] || []);
  DAL_SESSION_INDEX_COLS.forEach(function (colName) {
    if (iMap[colName] !== undefined) return;
    var colIdx = indexData[0].length;
    indexSheet.getRange(1, colIdx + 1).setValue(colName);
    iMap[colName] = colIdx;
    indexData[0].push(colName);
  });
  return iMap;
}

function dalGetProjectIndexRow_(projectId, sheets) {
  var indexData = sheets.index.getDataRange().getValues();
  if (indexData.length === 0) return null;
  var iMap = dalEnsureSessionIndexColumns_(sheets.index, indexData);
  for (var i = 1; i < indexData.length; i++) {
    if (String(indexData[i][iMap['uid']]) === String(projectId)) {
      return { rowNum: i + 1, map: iMap, data: indexData[i] };
    }
  }
  return null;
}

/**
 * Read session record for a project (google.script.run safe — read only).
 */
function getDalSessionInfo(projectId) {
  return executeWithRetry(function () {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return { projectId: projectId, status: DAL_SESSION.NORMAL, sessionType: '', sessionUid: '' };
    var m = row.map;
    return {
      projectId: projectId,
      status: String(row.data[m['Dal_Session_Status']] || DAL_SESSION.NORMAL),
      sessionType: String(row.data[m['Dal_Session_Type']] || ''),
      sessionUid: String(row.data[m['Dal_Session_UID']] || ''),
      openedAt: row.data[m['Dal_Session_Opened_At']] || '',
      openedBy: row.data[m['Dal_Session_Opened_By']] || ''
    };
  }, 3, true);
}

function resolveDalSessionStatus_(projectId, domain) {
  try {
    var sheets = verifyDatabaseSchema(true);
    var row = dalGetProjectIndexRow_(projectId, sheets);
    if (!row) return DAL_SESSION.NORMAL;

    var m = row.map;
    var status = String(row.data[m['Dal_Session_Status']] || '').toLowerCase();
    var sessionType = String(row.data[m['Dal_Session_Type']] || '');

    if (status === 'committing') return DAL_SESSION.COMMITTING;
    if (status !== 'open') return DAL_SESSION.NORMAL;

    if (domain === DAL_DOMAIN.PROJECT_ASSETS && sessionType === DAL_SESSION_TYPE.PREP) {
      return DAL_SESSION.SESSION_OPEN;
    }
    if (domain === DAL_DOMAIN.TIMELINE && sessionType === DAL_SESSION_TYPE.TIMELINE_COLLAB) {
      return DAL_SESSION.SESSION_OPEN;
    }
    return DAL_SESSION.NORMAL;
  } catch (e) {
    return DAL_SESSION.NORMAL;
  }
}
