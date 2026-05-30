/**

 * JavaBean for Admin2 — preset card picker (admin-next custom field).

 */

(function () {

  const TAG = window.__GRAV_FIELD_TAG || 'javabean-preset-picker';



  function fontLabel(preset) {
    if (preset.fontLabel) return preset.fontLabel;
    const list = window.__JAVABEAN_FONTS__ || [];
    const hit = list.find((f) => f.slug === preset.fontFamily);
    if (hit?.label) return hit.label;
    return (preset.fontFamily || 'jost').replace(/-/g, ' ');
  }

  function isDarkMode() {

    return document.documentElement.classList.contains('dark');

  }



  function branchTokens(preset) {

    const tokens = preset.tokens || {};

    return isDarkMode() ? tokens.dark || tokens.light || {} : tokens.light || tokens.dark || {};

  }



  function cssColor(value, fallback) {

    if (!value || typeof value !== 'string') return fallback;

    const v = value.trim();

    if (v.startsWith('hsl(') && !v.includes(',')) {

      return v.replace(/^hsl\(/, 'hsl(').replace(/\)\s*$/, ')');

    }

    return v;

  }



  function apiConfig() {

    return {

      serverUrl: window.__GRAV_API_SERVER_URL || window.__GRAV_CONFIG__?.serverUrl || '',

      apiPrefix: window.__GRAV_API_PREFIX || window.__GRAV_CONFIG__?.apiPrefix || '/api/v1',

      token: window.__GRAV_API_TOKEN || null,

    };

  }



  class JavaBeanPresetPicker extends HTMLElement {

    static get observedAttributes() {

      return ['value'];

    }



    constructor() {

      super();

      this.attachShadow({ mode: 'open' });

      this._presets = [];

      this._value = 'javabean-classic';

      this._loaded = false;

      this._previewSlug = null;

      this.field = null;

    }



    connectedCallback() {

      this._value = this.getAttribute('value') || this._value;

      this._renderShell();

      this._loadPresets();

      this._darkObserver = new MutationObserver(() => this._renderCards());

      this._darkObserver.observe(document.documentElement, {

        attributes: true,

        attributeFilter: ['class'],

      });

    }



    disconnectedCallback() {

      this._darkObserver?.disconnect();

    }



    attributeChangedCallback(name, _old, value) {

      if (name === 'value' && value !== this._value) {

        this._value = value;

        this._renderCards();

      }

    }



    get value() {

      return this._value;

    }



    set value(v) {

      this._value = v || 'javabean-classic';

      this.setAttribute('value', this._value);

      this._renderCards();

    }



    _emitChange() {

      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: this._value }));

      this.dispatchEvent(new CustomEvent('commit', { bubbles: true, detail: this._value }));

    }



    async _loadPresets() {

      try {

        const { serverUrl, apiPrefix, token } = apiConfig();

        const headers = {};

        if (token) headers.Authorization = `Bearer ${token}`;



        const res = await fetch(`${serverUrl}${apiPrefix}/javabean/presets`, {

          credentials: 'include',

          headers,

        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        this._presets = json.data?.presets || json.presets || [];

        this._loaded = true;

        this._renderCards();

      } catch (err) {

        console.warn('[JavaBean] preset load failed', err);

        const status = this.shadowRoot?.querySelector('.status');

        if (status) {

          status.textContent = 'Could not load presets — check JavaBean plugin is enabled.';

        }

      }

    }



    async _livePreview(preset) {

      this._previewSlug = preset.slug;

      if (window.JavaBean?.previewPreset) {

        await window.JavaBean.previewPreset(preset.slug, preset);

      }

    }



    _renderShell() {

      this.shadowRoot.innerHTML = `

        <style>

          :host {

            display: block;

            font-family: ui-sans-serif, system-ui, sans-serif;

            color: var(--foreground, #e4e4e7);

          }

          .grid {

            display: grid;

            grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));

            gap: 0.75rem;

          }

          .status {

            font-size: 0.75rem;

            color: var(--muted-foreground, #a1a1aa);

            margin-bottom: 0.65rem;

          }

          .card {

            border: 2px solid var(--border, #3f3f46);

            border-radius: 0.85rem;

            padding: 0.55rem;

            cursor: pointer;

            transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;

            background: var(--card, #18181b);

            text-align: left;

          }

          .card:hover {

            transform: translateY(-2px);

            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);

          }

          .card.selected {

            border-color: #a78bfa;

            box-shadow: 0 0 0 1px #a78bfa;

          }

          .card.previewing:not(.selected) {

            border-color: #6366f1;

            box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.45);

          }

          .preview {

            border-radius: 0.55rem;

            padding: 0.65rem 0.6rem 0.55rem;

            min-height: 4.25rem;

            border: 1px solid rgba(0, 0, 0, 0.08);

            margin-bottom: 0.45rem;

            display: flex;

            flex-direction: column;

            gap: 0.35rem;

          }

          .title-line {

            font-weight: 600;

            font-size: 0.78rem;

            line-height: 1.2;

          }

          .accent {

            display: inline-block;

            width: 2rem;

            height: 0.42rem;

            border-radius: 999px;

          }

          .font-row {

            font-size: 0.66rem;

            opacity: 0.88;

          }

          .name {

            font-size: 0.74rem;

            font-weight: 700;

            line-height: 1.2;

          }

          .tagline {

            font-size: 0.62rem;

            color: var(--muted-foreground, #a1a1aa);

            margin-top: 0.15rem;

          }

        </style>

        <div class="status">Loading presets…</div>

        <div class="grid"></div>

      `;

    }



    _renderCards() {

      const grid = this.shadowRoot.querySelector('.grid');

      const status = this.shadowRoot.querySelector('.status');

      if (!grid) return;

      grid.innerHTML = '';



      if (!this._loaded) return;

      status.textContent = `${this._presets.length} presets — click to live-preview · save to keep`;



      this._presets.forEach((preset) => {

        const t = branchTokens(preset);

        const bg = cssColor(t.background, isDarkMode() ? '#18181b' : '#fafafa');

        const fg = cssColor(t.foreground, isDarkMode() ? '#fafafa' : '#18181b');

        const primary = cssColor(t.primary, '#7c3aed');

        const selected = preset.slug === this._value;

        const previewing = preset.slug === this._previewSlug;



        const card = document.createElement('button');

        card.type = 'button';

        card.className =

          'card' +

          (selected ? ' selected' : '') +

          (previewing && !selected ? ' previewing' : '');



        card.innerHTML = `

          <div class="preview" style="background:${bg};color:${fg}">

            <div class="title-line">Page Title</div>

            <span class="accent" style="background:${primary}"></span>

            <div class="font-row" style="font-family:${preset.fontStack || 'inherit'}">

              Aa ${fontLabel(preset)}

            </div>

          </div>

          <div class="name">${preset.name}</div>

          <div class="tagline">${preset.tagline || ''}</div>

        `;



        card.addEventListener('click', async () => {

          this._value = preset.slug;

          this.setAttribute('value', preset.slug);

          this._emitChange();

          this._renderCards();

          await this._livePreview(preset);

        });



        grid.appendChild(card);

      });

    }

  }



  if (!customElements.get(TAG)) {

    customElements.define(TAG, JavaBeanPresetPicker);

  }

})();


