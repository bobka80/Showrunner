/**
 * SM Showrunner — DAL Phase 6
 * Dal_Cache.js — tag-aware cache invalidation (server)
 *
 * Repos/sessions call dalInvalidateCacheTags_(['project:ID:pa']) instead of global flushCache()
 * when only one domain changed. Tag '*' / 'global' still full-flushes.
 *
 * Phase 6B: selective tags also purge CacheService keys for mapped sheet names
 * (without bumping DB_CACHE_VERSION_V2 — preserves other domains' cold reads).
 */

// @INDEX: DAL -> Cache coordinator (Phase 6)

/**
 * Sheet names owned by a logical invalidation tag.
 * @param {string} tag
 * @returns {string[]}
 */
function dalSheetNamesForTag_(tag) {
  tag = String(tag || '');
  if (tag === 'vault' || tag.indexOf(':vault') !== -1 || tag === 'warehouse') {
    return [
      'Assets', 'Warehouses', 'Subzones', 'Areas', 'Clients', 'Vehicles',
      'Tags', 'Departments', 'Crew', 'Roles', 'System_Config', 'Vendors'
    ];
  }
  if (/:pa$/.test(tag)) return ['Project_Assets'];
  if (/:timeline$/.test(tag)) {
    return ['Shift_Assignments', 'Phase_Blocks', 'Dept_Overrides', 'Project_Timelines', 'Projects_Index'];
  }
  if (tag === 'calendar' || tag === 'directory') {
    return [
      'Projects_Index', 'Project_Timelines', 'Shift_Assignments', 'Phase_Blocks',
      'Global_Tasks', 'Notifications', 'Leave_Tracker', 'Task_Assignees', 'Task_Todos'
    ];
  }
  if (tag === 'fleet') return ['Vehicles'];
  if (tag === 'clients') return ['Clients'];
  if (tag === 'tracker') {
    return ['Project_Assets', 'Shift_Assignments', 'Phase_Blocks', 'Projects_Index', 'Operations_Ledger'];
  }
  return [];
}

/**
 * Remove CacheService entries for sheet names under the current cache version.
 * @param {string[]} sheetNames
 */
function dalPurgeSheetCacheKeys_(sheetNames) {
  if (!sheetNames || !sheetNames.length) return;
  try {
    var version = getCacheVersion();
    var cache = CacheService.getScriptCache();
    var i, j, name, cacheKey, chunks;
    for (i = 0; i < sheetNames.length; i++) {
      name = sheetNames[i];
      cacheKey = 'DB_' + version + '_' + name;
      cache.remove(cacheKey);
      chunks = parseInt(cache.get(cacheKey + '_chunks') || '0', 10);
      if (chunks > 0) {
        for (j = 0; j < chunks; j++) cache.remove(cacheKey + '_' + j);
        cache.remove(cacheKey + '_chunks');
      }
      try {
        if (typeof sheetDataCache !== 'undefined' && sheetDataCache && sheetDataCache[name]) {
          delete sheetDataCache[name];
        }
      } catch (eMem) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }
}

/**
 * Selective invalidation. Never required to wipe the other domain's live fork state.
 * @param {string[]} tags e.g. ['project:abc:pa'] or ['*']
 * @returns {{ flushed: string, tags: string[] }}
 */
function dalInvalidateCacheTags_(tags) {
  tags = (tags || []).map(function (t) { return String(t || ''); }).filter(Boolean);
  var global = false;
  var i;
  for (i = 0; i < tags.length; i++) {
    if (tags[i] === '*' || tags[i] === 'global') {
      global = true;
      break;
    }
  }

  if (global || tags.length === 0) {
    flushCache();
    return { flushed: 'global', tags: tags.length ? tags : ['*'] };
  }

  // Selective: clear in-memory sheet blob cache for touched sheets; purge CacheService
  // keys for those sheets only — do NOT bump DB_CACHE_VERSION (other domains stay warm).
  try {
    sheetDataCache = {};
  } catch (e1) { /* ignore */ }

  var names = [];
  var seen = {};
  var touchVault = false;
  for (i = 0; i < tags.length; i++) {
    if (tags[i] === 'vault' || tags[i].indexOf(':vault') !== -1 || tags[i] === 'warehouse') {
      touchVault = true;
    }
    var list = dalSheetNamesForTag_(tags[i]);
    var n;
    for (n = 0; n < list.length; n++) {
      if (!seen[list[n]]) {
        seen[list[n]] = true;
        names.push(list[n]);
      }
    }
  }
  dalPurgeSheetCacheKeys_(names);

  if (touchVault) {
    try { vaultAssetCache = null; } catch (e2) { /* ignore */ }
  }

  return { flushed: 'selective', tags: tags };
}

function dalCacheTagPa_(projectId) {
  return 'project:' + String(projectId || '') + ':pa';
}

function dalCacheTagTimeline_(projectId) {
  return 'project:' + String(projectId || '') + ':timeline';
}
