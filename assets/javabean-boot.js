/**
 * JavaBean boot — live preview, theme refresh, Andy accent/font sync.
 */
(function () {
  const STYLE_ID = 'javabean-theme';
  const GOOGLE_LINK_PREFIX = 'javabean-gf-';

  function fontCatalogMap() {
    const list = window.__JAVABEAN_FONTS__ || [];
    const map = {};
    list.forEach((f) => {
      if (f?.slug) map[f.slug] = f;
    });
    return map;
  }

  function fontStack(fontKey) {
    const meta = fontCatalogMap()[fontKey];
    return meta?.stack || null;
  }

  function isAndyFont(fontKey) {
    return !!fontCatalogMap()[fontKey]?.andy;
  }

  function ensureGoogleFont(fontKey) {
    const meta = fontCatalogMap()[fontKey];
    if (!meta?.google) return;
    const id = `${GOOGLE_LINK_PREFIX}${fontKey}`;
    if (document.getElementById(id)) return;
    if (!document.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]')) {
      const pre1 = document.createElement('link');
      pre1.rel = 'preconnect';
      pre1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(pre1);
      const pre2 = document.createElement('link');
      pre2.rel = 'preconnect';
      pre2.href = 'https://fonts.gstatic.com';
      pre2.crossOrigin = '';
      document.head.appendChild(pre2);
    }
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${meta.google}&display=swap`;
    document.head.appendChild(link);
  }

  function apiBase() {
    const cfg = window.__GRAV_CONFIG__ || {};
    return {
      url: (cfg.serverUrl || '') + (cfg.apiPrefix || '/api/v1'),
      token: window.__GRAV_API_TOKEN || null,
    };
  }

  function authHeaders() {
    const { token } = apiBase();
    if (token) return { Authorization: `Bearer ${token}` };
    const key = Object.keys(localStorage).find((k) => k.startsWith('grav_admin_auth'));
    if (!key) return {};
    try {
      const auth = JSON.parse(localStorage.getItem(key) || '{}');
      if (auth.accessToken) return { Authorization: `Bearer ${auth.accessToken}` };
    } catch (_) {}
    return {};
  }

  function parseCssBlock(css, selector) {
    const re = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`, 'm');
    const match = css.match(re);
    if (!match) return {};
    const vars = {};
    match[1].replace(/(--[\w-]+)\s*:\s*([^;]+);/g, (_, key, val) => {
      vars[key.trim()] = val.trim();
    });
    return vars;
  }

  function applyInlineThemeVars(css) {
    const root = document.documentElement;
    const branch = root.classList.contains('dark') ? '.dark' : ':root';
    const vars = parseCssBlock(css, branch);
    Object.entries(vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  }

  function applyFontInline(fontKey) {
    const stack = fontStack(fontKey);
    if (!stack) return;
    ensureGoogleFont(fontKey);
    document.documentElement.style.setProperty('--font-sans', stack);
  }

  async function patchPreferences(body) {
    if (!body || Object.keys(body).length === 0) return;
    const { url } = apiBase();
    try {
      await fetch(`${url}/admin-next/preferences/user`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.warn('[JavaBean] preference sync failed', err);
    }
  }

  async function syncFontFamily(fontKey) {
    if (!fontKey || !fontStack(fontKey)) return;
    applyFontInline(fontKey);
    if (isAndyFont(fontKey)) {
      await patchPreferences({ fontFamily: fontKey });
    }
  }

  async function syncAndyPreferences(preset) {
    if (!preset) return;
    const body = {};
    const accent = preset.accentDefault;
    if (accent && typeof accent.hue === 'number') {
      body.accentHue = accent.hue;
      body.accentSaturation = accent.saturation ?? 91;
    }
    if (preset.fontFamily && fontStack(preset.fontFamily)) {
      applyFontInline(preset.fontFamily);
      if (isAndyFont(preset.fontFamily)) {
        body.fontFamily = preset.fontFamily;
      }
    }
    await patchPreferences(body);
  }

  async function syncPreferencesFromSettings() {
    try {
      const { url } = apiBase();
      const headers = authHeaders();
      const res = await fetch(`${url}/javabean/settings`, {
        credentials: 'include',
        headers,
      });
      if (!res.ok) return;

      const json = await res.json();
      const data = json.data || json;
      const styling = data.advanced?.styling || data.styling || {};
      const presetSlug = data.presets?.active_preset || data.active_preset;

      let preset = null;
      if (presetSlug) {
        const presetsRes = await fetch(`${url}/javabean/presets`, {
          credentials: 'include',
          headers,
        });
        if (presetsRes.ok) {
          const presetsJson = await presetsRes.json();
          const presets = presetsJson.data?.presets || presetsJson.presets || [];
          preset = presets.find((p) => p.slug === presetSlug) || null;
        }
      }

      const body = {};
      const usePresetFont = styling.usePresetFont !== false;
      const fontKey = !usePresetFont && styling.fontFamily
        ? styling.fontFamily
        : preset?.fontFamily;

      if (fontKey && fontStack(fontKey)) {
        applyFontInline(fontKey);
        if (isAndyFont(fontKey)) {
          body.fontFamily = fontKey;
        }
      }

      const usePresetAccent = styling.usePresetAccent !== false;
      if (!usePresetAccent && styling.accentHue != null) {
        body.accentHue = styling.accentHue;
        body.accentSaturation = styling.accentSaturation ?? 91;
      } else if (preset?.accentDefault && typeof preset.accentDefault.hue === 'number') {
        body.accentHue = preset.accentDefault.hue;
        body.accentSaturation = preset.accentDefault.saturation ?? 91;
      }

      await patchPreferences(body);
    } catch (err) {
      console.warn('[JavaBean] settings preference sync failed', err);
    }
  }

  async function loadThemeCss(preset) {
    const { url } = apiBase();
    const paths = ['/javabean/theme.css', '/mud-admin/javabean/theme.css'];
    let lastErr = null;

    for (const path of paths) {
      let fetchUrl = `${url}${path}`;
      if (preset) {
        fetchUrl += `?preset=${encodeURIComponent(preset)}`;
      }

      try {
        const res = await fetch(fetchUrl, {
          credentials: 'include',
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`theme.css HTTP ${res.status}`);
        return res.text();
      } catch (err) {
        lastErr = err;
      }
    }

    throw lastErr || new Error('theme.css unavailable');
  }

  async function applyThemeCss(css) {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
    applyInlineThemeVars(css);
  }

  async function refreshThemeCss() {
    try {
      const css = await loadThemeCss();
      await applyThemeCss(css);
      await syncPreferencesFromSettings();
      const el = document.getElementById(STYLE_ID);
      if (el) el.removeAttribute('data-preview');
    } catch (err) {
      console.warn('[JavaBean] theme refresh failed', err);
    }
  }

  async function previewPreset(slug, presetMeta) {
    try {
      const css = await loadThemeCss(slug);
      await applyThemeCss(css);
      const el = document.getElementById(STYLE_ID);
      if (el) el.dataset.preview = slug;
      await syncAndyPreferences(presetMeta);
    } catch (err) {
      console.warn('[JavaBean] preview failed', err);
    }
  }

  const observer = new MutationObserver(() => {
    refreshThemeCss();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const res = await origFetch(input, init);
    try {
      const reqUrl = typeof input === 'string' ? input : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      if (reqUrl.includes('/javabean/settings') && method === 'PATCH' && res.ok) {
        await refreshThemeCss();
        window.dispatchEvent(new CustomEvent('javabean:theme-saved'));
      }
    } catch (_) {}
    return res;
  };

  window.JavaBean = {
    refreshThemeCss,
    previewPreset,
    applyThemeCss,
    syncFontFamily,
    syncPreferencesFromSettings,
    ensureGoogleFont,
    fontCatalogMap,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => refreshThemeCss(), { once: true });
  } else {
    refreshThemeCss();
  }
})();
