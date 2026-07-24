/* Visual Host client — theme playground */
(function () {
  'use strict';

  var registry = null;
  var activeId = 'dark';
  var dirty = false;

  var el = {
    select: document.getElementById('vh-theme-select'),
    label: document.getElementById('vh-theme-label'),
    base: document.getElementById('vh-theme-base'),
    tokens: document.getElementById('vh-token-list'),
    status: document.getElementById('vh-status'),
    previewName: document.getElementById('vh-preview-theme-name'),
    swatches: document.getElementById('vh-swatches'),
    previewRoot: document.getElementById('preview-root'),
    bake: document.getElementById('vh-bake'),
    reload: document.getElementById('vh-reload'),
    neu: document.getElementById('vh-new-theme'),
    del: document.getElementById('vh-delete-theme')
  };

  function setStatus(msg, kind) {
    el.status.textContent = msg || '';
    el.status.className = kind || '';
  }

  function themeById(id) {
    return (registry.themes || []).find(function (t) { return t.id === id; }) || null;
  }

  function slugify(raw) {
    return String(raw || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'theme';
  }

  function isColorToken(value) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(value || '').trim());
  }

  function syncSelect() {
    el.select.innerHTML = '';
    (registry.themes || []).forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label + (t.builtin ? '' : ' (custom)');
      el.select.appendChild(opt);
    });
    el.select.value = activeId;
  }

  function applyPreview() {
    var theme = themeById(activeId);
    if (!theme) return;
    var root = document.documentElement;
    var body = document.body;
    root.classList.remove('theme-light');
    body.classList.remove('theme-light');
    Array.prototype.slice.call(root.classList).forEach(function (c) {
      if (c.indexOf('theme-') === 0) root.classList.remove(c);
    });
    Array.prototype.slice.call(body.classList).forEach(function (c) {
      if (c.indexOf('theme-') === 0) body.classList.remove(c);
    });

    Object.keys(theme.tokens || {}).forEach(function (key) {
      root.style.setProperty(key, theme.tokens[key]);
      el.previewRoot.style.setProperty(key, theme.tokens[key]);
    });

    if (theme.base === 'light' || theme.id === 'light') {
      root.classList.add('theme-light');
      body.classList.add('theme-light');
    }
    if (theme.id !== 'dark' && theme.id !== 'light') {
      root.classList.add('theme-' + theme.id);
      body.classList.add('theme-' + theme.id);
    }

    el.previewName.textContent = theme.label + ' · ' + theme.base + ' family';
    renderSwatches(theme);
  }

  function renderSwatches(theme) {
    el.swatches.innerHTML = '';
    (registry.tokenMeta || []).forEach(function (meta) {
      var val = theme.tokens[meta.key];
      if (val == null) return;
      if (!isColorToken(val)) return;
      var box = document.createElement('div');
      box.className = 'vh-swatch';
      box.innerHTML =
        '<div class="vh-swatch-chip" style="background:' + val + ';"></div>' +
        '<div class="vh-swatch-cap">' + meta.label + '<br>' + val + '</div>';
      el.swatches.appendChild(box);
    });
  }

  function renderTokenEditors() {
    var theme = themeById(activeId);
    if (!theme) return;
    el.label.value = theme.label || '';
    el.base.value = theme.base || 'dark';
    el.base.disabled = !!theme.builtin;
    el.del.disabled = !!theme.builtin;

    el.tokens.innerHTML = '';
    var lastGroup = null;
    (registry.tokenMeta || []).forEach(function (meta) {
      var lightOnly = meta.group === 'light-only';
      if (lightOnly && theme.base !== 'light' && theme.id !== 'light') return;

      if (meta.group !== lastGroup) {
        lastGroup = meta.group;
        var gt = document.createElement('div');
        gt.className = 'vh-group-title';
        gt.textContent = meta.group;
        el.tokens.appendChild(gt);
      }

      var val = theme.tokens[meta.key];
      if (val == null) {
        if (lightOnly) {
          theme.tokens[meta.key] = meta.key.indexOf('shadow') >= 0
            ? '0 4px 6px -1px rgba(0,0,0,0.05)'
            : '#d1d5db';
          val = theme.tokens[meta.key];
        } else {
          return;
        }
      }

      var row = document.createElement('div');
      row.className = 'vh-token';
      var controls = '';
      if (meta.type === 'text' || !isColorToken(val)) {
        controls =
          '<input type="text" data-key="' + meta.key + '" value="' +
          String(val).replace(/"/g, '&quot;') + '" />';
      } else {
        controls =
          '<input type="color" data-key="' + meta.key + '" value="' + normalizeHex(val) + '" />' +
          '<input type="text" data-key="' + meta.key + '" value="' + val + '" />';
      }
      row.innerHTML =
        '<div class="vh-token-meta">' +
          '<div class="vh-token-label">' + meta.label + '</div>' +
          '<div class="vh-token-key">' + meta.key + '</div>' +
        '</div>' +
        '<div class="vh-token-controls">' + controls + '</div>';
      el.tokens.appendChild(row);
    });

    el.tokens.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('input', onTokenInput);
    });
  }

  function normalizeHex(v) {
    var s = String(v || '').trim();
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    }
    if (/^#[0-9a-f]{6}$/i.test(s)) return s;
    return '#698b99';
  }

  function onTokenInput(ev) {
    var theme = themeById(activeId);
    if (!theme) return;
    var key = ev.target.getAttribute('data-key');
    var value = ev.target.value;
    theme.tokens[key] = value;
    dirty = true;
    if (ev.target.type === 'color') {
      var textSibling = ev.target.parentNode.querySelector('input[type="text"][data-key="' + key + '"]');
      if (textSibling) textSibling.value = value;
    } else if (isColorToken(value)) {
      var colorSibling = ev.target.parentNode.querySelector('input[type="color"][data-key="' + key + '"]');
      if (colorSibling) colorSibling.value = normalizeHex(value);
    }
    applyPreview();
    setStatus('Unsaved changes — bake to write into the app.', '');
  }

  function loadTheme(id) {
    if (!themeById(id)) id = (registry.themes[0] && registry.themes[0].id) || 'dark';
    activeId = id;
    syncSelect();
    renderTokenEditors();
    applyPreview();
  }

  async function fetchRegistry() {
    setStatus('Loading registry…');
    var res = await fetch('/api/registry');
    if (!res.ok) throw new Error('Failed to load registry');
    registry = await res.json();
    dirty = false;
    loadTheme(activeId);
    setStatus('Loaded ' + registry.themes.length + ' theme(s).', 'ok');
  }

  async function bake() {
    var theme = themeById(activeId);
    if (!theme) return;
    theme.label = (el.label.value || theme.id).trim();
    if (!theme.builtin) {
      theme.base = el.base.value === 'light' ? 'light' : 'dark';
    }
    setStatus('Baking…');
    el.bake.disabled = true;
    try {
      var res = await fetch('/api/bake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registry: registry, activeId: activeId })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error((data && data.error) || 'Bake failed');
      registry = data.registry;
      dirty = false;
      loadTheme(activeId);
      setStatus(
        'Baked. Updated:\n' + (data.files || []).join('\n') +
        '\n\nShip app CSS/theme engine with:\nnode milestone.js "Themes — Visual Host bake"',
        'ok'
      );
    } catch (err) {
      setStatus(String(err.message || err), 'err');
    } finally {
      el.bake.disabled = false;
    }
  }

  function newTheme() {
    var label = window.prompt('New theme label', 'Custom');
    if (!label) return;
    var id = slugify(label);
    var n = 2;
    while (themeById(id)) {
      id = slugify(label) + '-' + n;
      n++;
    }
    var base = el.base.value === 'light' ? 'light' : 'dark';
    var source = themeById(base) || themeById('dark');
    var tokens = JSON.parse(JSON.stringify(source.tokens || {}));
    registry.themes.push({
      id: id,
      label: label.trim(),
      base: base,
      builtin: false,
      tokens: tokens
    });
    dirty = true;
    loadTheme(id);
    setStatus('Draft theme "' + label + '" — bake to add it to the app.', '');
  }

  function deleteTheme() {
    var theme = themeById(activeId);
    if (!theme || theme.builtin) return;
    if (!window.confirm('Delete custom theme "' + theme.label + '"? Bake after delete to remove it from the app.')) return;
    registry.themes = registry.themes.filter(function (t) { return t.id !== theme.id; });
    dirty = true;
    loadTheme('dark');
    setStatus('Removed from playground. Bake to update the app.', '');
  }

  el.select.addEventListener('change', function () {
    if (dirty && !window.confirm('Switch theme? Unsaved token edits stay in memory until bake/reload.')) {
      el.select.value = activeId;
      return;
    }
    loadTheme(el.select.value);
  });
  el.label.addEventListener('input', function () {
    var theme = themeById(activeId);
    if (!theme) return;
    theme.label = el.label.value;
    dirty = true;
    syncSelect();
    el.previewName.textContent = theme.label + ' · ' + theme.base + ' family';
  });
  el.base.addEventListener('change', function () {
    var theme = themeById(activeId);
    if (!theme || theme.builtin) return;
    theme.base = el.base.value === 'light' ? 'light' : 'dark';
    dirty = true;
    renderTokenEditors();
    applyPreview();
  });
  el.bake.addEventListener('click', bake);
  el.reload.addEventListener('click', function () {
    if (dirty && !window.confirm('Reload and discard unsaved playground edits?')) return;
    fetchRegistry().catch(function (err) { setStatus(String(err.message || err), 'err'); });
  });
  el.neu.addEventListener('click', newTheme);
  el.del.addEventListener('click', deleteTheme);

  fetchRegistry().catch(function (err) {
    setStatus(String(err.message || err), 'err');
  });
})();
