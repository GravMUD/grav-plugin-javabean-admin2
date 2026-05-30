/**
 * JavaBean for Admin2 — advanced styling paint shop (admin-next custom field).
 */
(function () {
  const TAG = window.__GRAV_FIELD_TAG || 'javabean-advanced-styling';

  const ACCENT_PRESETS = [
    { label: 'Grav', hue: 271, saturation: 91 },
    { label: 'Blue', hue: 221, saturation: 83 },
    { label: 'Violet', hue: 263, saturation: 70 },
    { label: 'Rose', hue: 347, saturation: 77 },
    { label: 'Orange', hue: 25, saturation: 95 },
    { label: 'Amber', hue: 38, saturation: 92 },
    { label: 'Emerald', hue: 160, saturation: 84 },
    { label: 'Teal', hue: 172, saturation: 66 },
    { label: 'Cyan', hue: 192, saturation: 91 },
    { label: 'Zinc', hue: 240, saturation: 6 },
  ];

  const FONT_CATEGORIES = [
    { key: 'sans', label: 'Sans' },
    { key: 'serif', label: 'Serif' },
    { key: 'mono', label: 'Mono' },
  ];

  function fontList() {
    const injected = window.__JAVABEAN_FONTS__;
    if (Array.isArray(injected) && injected.length) return injected;
    return [
      { slug: 'google-sans', label: 'Google Sans', category: 'sans', stack: "'Google Sans', ui-sans-serif, system-ui, sans-serif", andy: true },
      { slug: 'inter', label: 'Inter', category: 'sans', stack: "'Inter', ui-sans-serif, system-ui, sans-serif", andy: true },
      { slug: 'public-sans', label: 'Public Sans', category: 'sans', stack: "'Public Sans', ui-sans-serif, system-ui, sans-serif", andy: true },
      { slug: 'nunito-sans', label: 'Nunito Sans', category: 'sans', stack: "'Nunito Sans', ui-sans-serif, system-ui, sans-serif", andy: true },
      { slug: 'jost', label: 'Jost', category: 'sans', stack: "'Jost', ui-sans-serif, system-ui, sans-serif", andy: true },
    ];
  }

  const DENSITY = [
    { value: 'compact', label: 'Compact', pad: '0.35rem', gap: '0.35rem' },
    { value: 'comfy', label: 'Comfy', pad: '0.55rem', gap: '0.5rem' },
    { value: 'spacious', label: 'Spacious', pad: '0.75rem', gap: '0.65rem' },
  ];

  const RADIUS = [
    { value: 'subtle', label: 'Subtle', px: '0.35rem' },
    { value: 'default', label: 'Default', px: '0.625rem' },
    { value: 'round', label: 'Round', px: '1rem' },
  ];

  const DEFAULTS = {
    accentHue: null,
    accentSaturation: null,
    usePresetAccent: true,
    density: 'comfy',
    fontFamily: null,
    usePresetFont: true,
    radius: 'default',
    customCss: '',
  };

  function apiConfig() {
    return {
      serverUrl: window.__GRAV_API_SERVER_URL || window.__GRAV_CONFIG__?.serverUrl || '',
      apiPrefix: window.__GRAV_API_PREFIX || window.__GRAV_CONFIG__?.apiPrefix || '/api/v1',
      token: window.__GRAV_API_TOKEN || null,
    };
  }

  function parseValue(raw) {
    if (raw == null || raw === '') return { ...DEFAULTS };
    if (typeof raw === 'string') {
      try {
        return { ...DEFAULTS, ...JSON.parse(raw) };
      } catch (_) {
        return { ...DEFAULTS };
      }
    }
    if (typeof raw === 'object') return { ...DEFAULTS, ...raw };
    return { ...DEFAULTS };
  }

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function readCssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  class JavaBeanAdvancedStyling extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._state = { ...DEFAULTS };
      this._cssOpen = false;
      this.field = null;
    }

    connectedCallback() {
      this._state = parseValue(this.getAttribute('value') ?? this.value);
      this._render();
      this._bind();
      this._darkObserver = new MutationObserver(() => this._updatePreview());
      this._darkObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    disconnectedCallback() {
      this._darkObserver?.disconnect();
    }

    get value() {
      return { ...this._state };
    }

    set value(v) {
      this._state = parseValue(v);
      if (this.isConnected && this.shadowRoot?.querySelector('.panel')) {
        this._syncControls();
        this._updatePreview();
      }
    }

    _emit() {
      const payload = { ...this._state };
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: payload }));
      this.dispatchEvent(new CustomEvent('commit', { bubbles: true, detail: payload }));
    }

    _accentColor() {
      if (this._state.usePresetAccent) {
        return readCssVar('--primary', 'hsl(271 91% 55%)');
      }
      const h = this._state.accentHue ?? 271;
      const s = this._state.accentSaturation ?? 91;
      return `hsl(${h} ${s}% 55%)`;
    }

    _radiusPx() {
      const hit = RADIUS.find((r) => r.value === this._state.radius);
      return hit?.px || '0.625rem';
    }

    _densityMeta() {
      return DENSITY.find((d) => d.value === this._state.density) || DENSITY[1];
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; font-family: ui-sans-serif, system-ui, sans-serif; color: #18181b; }
          :host-context(.dark), :host { color-scheme: light dark; }
          .panel {
            border: 1px solid #e4e4e7;
            border-radius: 0.85rem;
            background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
            overflow: hidden;
          }
          :host-context(.dark) .panel, .dark .panel {
            border-color: #3f3f46;
            background: linear-gradient(180deg, #18181b 0%, #09090b 100%);
            color: #fafafa;
          }
          .preview {
            padding: 1rem;
            border-bottom: 1px solid #e4e4e7;
            background: #f4f4f5;
          }
          :host-context(.dark) .preview { border-color: #3f3f46; background: #27272a; }
          .chrome {
            display: grid;
            grid-template-columns: 4.5rem 1fr;
            gap: 0.5rem;
            min-height: 5.5rem;
            border-radius: 0.65rem;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          }
          .sidebar { padding: 0.5rem 0.35rem; display: flex; flex-direction: column; gap: 0.35rem; }
          .nav-dot { height: 0.45rem; border-radius: 999px; opacity: 0.35; }
          .main { display: flex; flex-direction: column; }
          .topbar { display: flex; align-items: center; justify-content: space-between; padding: 0.45rem 0.65rem; }
          .topbar-title { font-size: 0.72rem; font-weight: 600; }
          .btn-sample {
            font-size: 0.62rem;
            padding: 0.25rem 0.55rem;
            border: none;
            border-radius: var(--preview-radius, 0.5rem);
            color: #fff;
            font-weight: 600;
          }
          .content { flex: 1; padding: var(--preview-pad, 0.55rem); display: flex; flex-direction: column; gap: var(--preview-gap, 0.5rem); }
          .card-sample { border-radius: var(--preview-radius, 0.5rem); padding: 0.45rem; border: 1px solid rgba(0,0,0,0.06); }
          .card-sample h4 { margin: 0 0 0.2rem; font-size: 0.68rem; }
          .card-sample p { margin: 0; font-size: 0.58rem; opacity: 0.72; }
          .body { padding: 1rem; display: flex; flex-direction: column; gap: 1.1rem; }
          section h3 {
            margin: 0 0 0.55rem;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #71717a;
          }
          :host-context(.dark) section h3 { color: #a1a1aa; }
          .swatches { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.65rem; }
          .swatch {
            border: 2px solid transparent;
            border-radius: 0.55rem;
            padding: 0.35rem 0.5rem;
            font-size: 0.65rem;
            font-weight: 600;
            cursor: pointer;
            background: #fff;
            color: #3f3f46;
            display: flex;
            align-items: center;
            gap: 0.35rem;
          }
          :host-context(.dark) .swatch { background: #27272a; color: #e4e4e7; border-color: #3f3f46; }
          .swatch.selected { border-color: #7c3aed; box-shadow: 0 0 0 1px #7c3aed; }
          .dot { width: 0.85rem; height: 0.85rem; border-radius: 999px; border: 1px solid rgba(0,0,0,0.08); }
          .slider-row { display: grid; grid-template-columns: 4.5rem 1fr 2.5rem; gap: 0.5rem; align-items: center; margin-bottom: 0.45rem; }
          .slider-row label { font-size: 0.68rem; color: #71717a; }
          input[type="range"] { width: 100%; accent-color: #7c3aed; }
          .slider-val { font-size: 0.68rem; text-align: right; font-variant-numeric: tabular-nums; }
          .toggle-row { display: flex; align-items: center; gap: 0.45rem; font-size: 0.68rem; color: #52525b; margin-top: 0.35rem; }
          .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
          .pick-card {
            border: 2px solid #e4e4e7;
            border-radius: 0.65rem;
            padding: 0.55rem;
            cursor: pointer;
            text-align: center;
            background: #fff;
            transition: transform 0.12s ease, border-color 0.12s ease;
          }
          :host-context(.dark) .pick-card { background: #27272a; border-color: #3f3f46; color: #fafafa; }
          .pick-card:hover { transform: translateY(-1px); }
          .pick-card.selected { border-color: #7c3aed; box-shadow: 0 0 0 1px #7c3aed; }
          .pick-card .label { font-size: 0.68rem; font-weight: 600; margin-top: 0.35rem; }
          .density-demo { display: flex; flex-direction: column; background: #f4f4f5; margin: 0 auto; width: 70%; }
          :host-context(.dark) .density-demo { background: #3f3f46; }
          .density-bar { background: #a1a1aa; border-radius: 2px; height: 0.35rem; }
          .radius-demo { width: 2rem; height: 2rem; margin: 0 auto; background: linear-gradient(135deg, #7c3aed, #a78bfa); }
          .font-pills { display: flex; flex-direction: column; gap: 0.65rem; }
          .font-group-label {
            font-size: 0.62rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #71717a;
            margin: 0 0 0.15rem;
          }
          :host-context(.dark) .font-group-label { color: #a1a1aa; }
          .font-group-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
          .font-pill {
            border: 1px solid #e4e4e7;
            border-radius: 999px;
            padding: 0.35rem 0.65rem;
            font-size: 0.72rem;
            cursor: pointer;
            background: #fff;
          }
          :host-context(.dark) .font-pill { background: #27272a; border-color: #3f3f46; color: #fafafa; }
          .font-pill.selected { border-color: #7c3aed; background: #f5f3ff; color: #5b21b6; }
          :host-context(.dark) .font-pill.selected { background: #3b0764; color: #e9d5ff; }
          .pro-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            margin-top: 0.5rem;
          }
          .pro-btn {
            font-size: 0.65rem;
            font-weight: 600;
            border: 1px solid #e4e4e7;
            border-radius: 0.45rem;
            padding: 0.35rem 0.55rem;
            cursor: pointer;
            background: #fff;
            color: #3f3f46;
          }
          :host-context(.dark) .pro-btn { background: #27272a; border-color: #52525b; color: #e4e4e7; }
          .pro-btn.danger { color: #b91c1c; border-color: #fecaca; }
          details.pro { border: 1px solid #e4e4e7; border-radius: 0.65rem; overflow: hidden; }
          :host-context(.dark) details.pro { border-color: #3f3f46; }
          details.pro summary {
            cursor: pointer;
            padding: 0.55rem 0.75rem;
            font-size: 0.72rem;
            font-weight: 600;
            background: #f4f4f5;
            list-style: none;
          }
          :host-context(.dark) details.pro summary { background: #27272a; }
          details.pro summary::-webkit-details-marker { display: none; }
          .css-editor {
            width: 100%;
            min-height: 8rem;
            border: none;
            padding: 0.75rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 0.72rem;
            line-height: 1.5;
            background: #0f172a;
            color: #e2e8f0;
            resize: vertical;
            box-sizing: border-box;
          }
          .hint { font-size: 0.62rem; color: #71717a; margin-top: 0.35rem; }
          input[type="file"] { display: none; }
        </style>

        <div class="panel">
          <div class="preview">
            <div class="chrome" id="chrome">
              <div class="sidebar" id="prev-sidebar">
                <div class="nav-dot" style="background:var(--prev-accent)"></div>
                <div class="nav-dot"></div>
                <div class="nav-dot"></div>
              </div>
              <div class="main">
                <div class="topbar" id="prev-topbar">
                  <span class="topbar-title">JavaBean cockpit</span>
                  <button type="button" class="btn-sample" id="prev-btn">Save</button>
                </div>
                <div class="content" id="prev-content">
                  <div class="card-sample" id="prev-card">
                    <h4>Page title</h4>
                    <p>Live preview — tracks Andy's light/dark switcher.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="body">
            <section>
              <h3>Accent</h3>
              <div class="swatches" id="accent-swatches"></div>
              <div class="slider-row">
                <label for="hue">Hue</label>
                <input id="hue" type="range" min="0" max="360" step="1" />
                <span class="slider-val" id="hue-val">271°</span>
              </div>
              <div class="slider-row">
                <label for="sat">Sat</label>
                <input id="sat" type="range" min="0" max="100" step="1" />
                <span class="slider-val" id="sat-val">91%</span>
              </div>
              <label class="toggle-row">
                <input type="checkbox" id="use-preset-accent" />
                Follow preset accent (Andy HSV picker still works in Settings → Appearance)
              </label>
            </section>

            <section>
              <h3>Density</h3>
              <div class="cards" id="density-cards"></div>
            </section>

            <section>
              <h3>Typography</h3>
              <label class="toggle-row">
                <input type="checkbox" id="use-preset-font" />
                Follow preset font
              </label>
              <div class="font-pills" id="font-pills" style="margin-top:0.55rem"></div>
            </section>

            <section>
              <h3>Corners</h3>
              <div class="cards" id="radius-cards"></div>
            </section>

            <section>
              <h3>Pro</h3>
              <details class="pro" id="css-details">
                <summary>Custom CSS — escape hatch only</summary>
                <textarea class="css-editor" id="css-editor" spellcheck="false" placeholder="/* Scoped overrides — e.g. .sidebar { ... } */"></textarea>
              </details>
              <div class="pro-bar">
                <button type="button" class="pro-btn" id="btn-export">Export JSON</button>
                <button type="button" class="pro-btn" id="btn-import">Import JSON</button>
                <button type="button" class="pro-btn danger" id="btn-reset">Reset to preset</button>
              </div>
              <input type="file" id="import-file" accept="application/json,.json" />
              <p class="hint">Share Backenders-style template packs. Import merges with current preset.</p>
            </section>
          </div>
        </div>
      `;
    }

    _bind() {
      const $ = (sel) => this.shadowRoot.querySelector(sel);

      this._buildAccentSwatches();
      this._buildDensityCards();
      this._buildRadiusCards();
      this._buildFontPills();

      $('#hue').addEventListener('input', (e) => {
        this._state.accentHue = Number(e.target.value);
        this._state.usePresetAccent = false;
        $('#use-preset-accent').checked = false;
        this._syncAccentUI();
        this._updatePreview();
        this._emit();
      });

      $('#sat').addEventListener('input', (e) => {
        this._state.accentSaturation = Number(e.target.value);
        this._state.usePresetAccent = false;
        $('#use-preset-accent').checked = false;
        this._syncAccentUI();
        this._updatePreview();
        this._emit();
      });

      $('#use-preset-accent').addEventListener('change', (e) => {
        this._state.usePresetAccent = e.target.checked;
        if (e.target.checked) {
          this._state.accentHue = null;
          this._state.accentSaturation = null;
        } else {
          this._state.accentHue = this._state.accentHue ?? 271;
          this._state.accentSaturation = this._state.accentSaturation ?? 91;
        }
        this._syncAccentUI();
        this._updatePreview();
        this._emit();
      });

      $('#use-preset-font').addEventListener('change', async (e) => {
        this._state.usePresetFont = e.target.checked;
        if (e.target.checked) this._state.fontFamily = null;
        this._syncFontUI();
        this._updatePreview();
        this._emit();
        if (window.JavaBean?.syncPreferencesFromSettings) {
          await window.JavaBean.syncPreferencesFromSettings();
        }
      });

      $('#css-editor').addEventListener('input', (e) => {
        this._state.customCss = e.target.value;
        this._emit();
      });

      $('#btn-export').addEventListener('click', () => this._exportJson());
      $('#btn-import').addEventListener('click', () => $('#import-file').click());
      $('#import-file').addEventListener('change', (e) => this._importJson(e));
      $('#btn-reset').addEventListener('click', () => this._resetToPreset());

      this._syncControls();
      this._updatePreview();
    }

    _buildAccentSwatches() {
      const wrap = this.shadowRoot.getElementById('accent-swatches');
      wrap.innerHTML = '';
      ACCENT_PRESETS.forEach((p) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swatch';
        btn.innerHTML = `<span class="dot" style="background:hsl(${p.hue} ${p.saturation}% 55%)"></span>${p.label}`;
        btn.addEventListener('click', () => {
          this._state.usePresetAccent = false;
          this._state.accentHue = p.hue;
          this._state.accentSaturation = p.saturation;
          this._syncAccentUI();
          this._updatePreview();
          this._emit();
          this._syncAccentToAndy(p.hue, p.saturation);
        });
        wrap.appendChild(btn);
      });
    }

    _buildDensityCards() {
      const wrap = this.shadowRoot.getElementById('density-cards');
      wrap.innerHTML = '';
      DENSITY.forEach((d) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'pick-card';
        card.dataset.value = d.value;
        card.innerHTML = `
          <div class="density-demo" style="padding:${d.pad};gap:${d.gap}">
            <div class="density-bar"></div>
            <div class="density-bar" style="width:75%"></div>
            <div class="density-bar" style="width:55%"></div>
          </div>
          <div class="label">${d.label}</div>`;
        card.addEventListener('click', () => {
          this._state.density = d.value;
          this._syncDensityUI();
          this._updatePreview();
          this._emit();
        });
        wrap.appendChild(card);
      });
    }

    _buildRadiusCards() {
      const wrap = this.shadowRoot.getElementById('radius-cards');
      wrap.innerHTML = '';
      RADIUS.forEach((r) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'pick-card';
        card.dataset.value = r.value;
        card.innerHTML = `
          <div class="radius-demo" style="border-radius:${r.px}"></div>
          <div class="label">${r.label}</div>`;
        card.addEventListener('click', () => {
          this._state.radius = r.value;
          this._syncRadiusUI();
          this._updatePreview();
          this._emit();
        });
        wrap.appendChild(card);
      });
    }

    _buildFontPills() {
      const wrap = this.shadowRoot.getElementById('font-pills');
      wrap.innerHTML = '';
      const fonts = fontList();
      FONT_CATEGORIES.forEach(({ key, label }) => {
        const groupFonts = fonts.filter((f) => f.category === key);
        if (!groupFonts.length) return;
        const group = document.createElement('div');
        group.className = 'font-group';
        const heading = document.createElement('p');
        heading.className = 'font-group-label';
        heading.textContent = label;
        group.appendChild(heading);
        const row = document.createElement('div');
        row.className = 'font-group-row';
        groupFonts.forEach((f) => {
          const pill = document.createElement('button');
          pill.type = 'button';
          pill.className = 'font-pill';
          pill.dataset.value = f.slug;
          pill.textContent = f.label;
          pill.style.fontFamily = f.stack || f.label;
          pill.addEventListener('click', async () => {
            this._state.usePresetFont = false;
            this._state.fontFamily = f.slug;
            this.shadowRoot.getElementById('use-preset-font').checked = false;
            this._syncFontUI();
            this._updatePreview();
            this._emit();
            if (window.JavaBean?.ensureGoogleFont) {
              window.JavaBean.ensureGoogleFont(f.slug);
            }
            if (window.JavaBean?.syncFontFamily) {
              await window.JavaBean.syncFontFamily(f.slug);
            }
          });
          row.appendChild(pill);
        });
        group.appendChild(row);
        wrap.appendChild(group);
      });
    }

    _syncControls() {
      if (!this.shadowRoot?.querySelector('#hue')) return;
      this._syncAccentUI();
      this._syncDensityUI();
      this._syncRadiusUI();
      this._syncFontUI();
      const cssEditor = this.shadowRoot.getElementById('css-editor');
      if (cssEditor) cssEditor.value = this._state.customCss || '';
    }

    _syncAccentUI() {
      const hueEl = this.shadowRoot.getElementById('hue');
      if (!hueEl) return;
      const hue = this._state.accentHue ?? 271;
      const sat = this._state.accentSaturation ?? 91;
      this.shadowRoot.getElementById('hue').value = String(hue);
      this.shadowRoot.getElementById('sat').value = String(sat);
      this.shadowRoot.getElementById('hue-val').textContent = `${hue}°`;
      this.shadowRoot.getElementById('sat-val').textContent = `${sat}%`;
      this.shadowRoot.getElementById('use-preset-accent').checked = !!this._state.usePresetAccent;

      const activeHue = this._state.usePresetAccent ? null : hue;
      const activeSat = this._state.usePresetAccent ? null : sat;
      this.shadowRoot.querySelectorAll('#accent-swatches .swatch').forEach((el, i) => {
        const p = ACCENT_PRESETS[i];
        const on = !this._state.usePresetAccent && p && p.hue === activeHue && p.saturation === activeSat;
        el.classList.toggle('selected', on);
      });

      const hueInput = this.shadowRoot.getElementById('hue');
      hueInput.disabled = !!this._state.usePresetAccent;
      this.shadowRoot.getElementById('sat').disabled = !!this._state.usePresetAccent;
    }

    _syncDensityUI() {
      this.shadowRoot.querySelectorAll('#density-cards .pick-card').forEach((el) => {
        el.classList.toggle('selected', el.dataset.value === this._state.density);
      });
    }

    _syncRadiusUI() {
      this.shadowRoot.querySelectorAll('#radius-cards .pick-card').forEach((el) => {
        el.classList.toggle('selected', el.dataset.value === this._state.radius);
      });
    }

    _syncFontUI() {
      this.shadowRoot.getElementById('use-preset-font').checked = !!this._state.usePresetFont;
      const disabled = !!this._state.usePresetFont;
      this.shadowRoot.querySelectorAll('#font-pills .font-pill').forEach((el) => {
        el.style.opacity = disabled ? '0.45' : '1';
        el.classList.toggle('selected', !disabled && el.dataset.value === this._state.fontFamily);
      });
    }

    _updatePreview() {
      const root = this.shadowRoot.getElementById('chrome');
      if (!root) return;
      const bg = readCssVar('--background', isDark() ? '#09090b' : '#ffffff');
      const fg = readCssVar('--foreground', isDark() ? '#fafafa' : '#18181b');
      const sidebar = readCssVar('--sidebar', bg);
      const border = readCssVar('--border', '#e4e4e7');
      const muted = readCssVar('--muted', sidebar);
      const accent = this._accentColor();
      const density = this._densityMeta();
      const radius = this._radiusPx();
      root.style.setProperty('--preview-radius', radius);
      root.style.setProperty('--preview-pad', density.pad);
      root.style.setProperty('--preview-gap', density.gap);
      root.style.setProperty('--prev-accent', accent);

      const sidebarEl = this.shadowRoot.getElementById('prev-sidebar');
      sidebarEl.style.background = sidebar;
      sidebarEl.style.borderRight = `1px solid ${border}`;

      const topbar = this.shadowRoot.getElementById('prev-topbar');
      topbar.style.background = bg;
      topbar.style.borderBottom = `1px solid ${border}`;
      topbar.querySelector('.topbar-title').style.color = fg;

      const btn = this.shadowRoot.getElementById('prev-btn');
      btn.style.background = accent;
      btn.style.borderRadius = radius;

      const content = this.shadowRoot.getElementById('prev-content');
      content.style.background = bg;

      const card = this.shadowRoot.getElementById('prev-card');
      card.style.background = muted;
      card.style.borderColor = border;
      card.querySelector('h4').style.color = fg;
      card.querySelector('p').style.color = fg;
    }

    async _syncAccentToAndy(hue, sat) {
      const { serverUrl, apiPrefix, token } = apiConfig();
      if (!token) return;
      try {
        await fetch(`${serverUrl}${apiPrefix}/admin-next/preferences/user`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accentHue: hue, accentSaturation: sat }),
        });
      } catch (_) {}
    }

    _exportJson() {
      const blob = new Blob([JSON.stringify(this._state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `javabean-styling-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    _importJson(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          this._state = { ...DEFAULTS, ...JSON.parse(String(reader.result)) };
          this._syncControls();
          this._updatePreview();
          this._emit();
        } catch (err) {
          console.warn('[JavaBean] import failed', err);
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    }

    _resetToPreset() {
      this._state = { ...DEFAULTS, customCss: '' };
      this._syncControls();
      this._updatePreview();
      this._emit();
    }
  }

  if (!customElements.get(TAG)) {
    customElements.define(TAG, JavaBeanAdvancedStyling);
  }
})();
