/**
 * SM Showrunner — DAL Phase 6A
 * Dal_Cache.js — tag-aware cache invalidation (server)
 *
 * Repos/sessions call dalInvalidateCacheTags_(['project:ID:pa']) instead of global flushCache()
 * when only one domain changed. Tag '*' / 'global' still full-flushes.
 */

// @INDEX: DAL -> Cache coordinator (Phase 6)

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

  // Selective: clear in-memory sheet blob cache only — do NOT bump DB_CACHE_VERSION
  // (that would invalidate every cold reader app-wide).
  try {
    sheetDataCache = {};
  } catch (e1) { /* ignore */ }

  var touchVault = false;
  for (i = 0; i < tags.length; i++) {
    if (tags[i] === 'vault' || tags[i].indexOf(':vault') !== -1) {
      touchVault = true;
      break;
    }
  }
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
