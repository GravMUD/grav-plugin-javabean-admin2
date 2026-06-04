# v1.1.2
## 06/04/2026

1. [](#bugfix)
    * **Fix:** Grav 2 plugin bootstrap — `return new GravJavabeanAdmin2Plugin($name, $grav)` so Andy slug `javabean-admin2` loads (fixes “enabled but not found” / missing Admin2 sidebar)

# v1.1.1
## 06/02/2026

1. [](#improved)
    * GetGRAV! menubar link points to **https://gravfans.live** (was getgrav.live)

# v1.1.0
## 06/01/2026

1. [](#breaking)
    * Plugin slug **`javabean-admin2`** (was `grav-javabean-admin2`) — Grav convention: repo `grav-plugin-javabean-admin2`, folder without extra `grav-` prefix
    * Admin plugin route `/plugin/javabean-admin2` (API routes stay `/javabean/*`)
    * Auto-migrates `user/config/plugins/grav-javabean-admin2.yaml` and `system.yaml` plugin enable entry on first load
    * Remove old `user/plugins/grav-javabean-admin2` folder after upgrade; run `bin/grav cache`

# v1.0.1
## 06/01/2026

1. [](#improved)
    * Team DC header icons register at runtime via `onApiMenubarItems` — no longer writes `user/config/admin-next.yaml`
    * `inject_menubar_links` defaults to off (opt-in)

# v1.0.0
## 05/30/2026

1. [](#new)
    * Public 1.0 launch — JavaBean for Admin2
    * Site and docs at https://javabean.gravmud.site
    * Twelve presets, Paint Shop, fourteen-font catalog, Andy appearance sync

# v0.1.0
## 05/30/2026

1. [](#new)
    * Initial public release — JavaBean for Admin2
    * Twelve free theme presets with paired light and dark token maps
    * Live preset card picker with mini-preview cockpit cards
    * Paint Shop advanced styling — accent, density, typography, corners, custom CSS
    * Fourteen-font catalog (sans, serif, mono) with Google Fonts loading
    * Andy Admin2 appearance sync — light/dark/system, accent HSV, font picker compatibility
    * REST API endpoints for presets, fonts, settings, and theme.css preview
