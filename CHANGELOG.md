# v1.1.4
## 06/25/2026

1. [](#improved)
    * **UI:** Remove promo section header from JavaBean settings page
    * **UI:** Fix preset card preview text colour on dark Admin2 themes

# v1.1.3
## 06/05/2026

1. [](#improved)
    * **Menubar:** URL shortcuts merge at runtime via `onApiAdminPreferencesResolved` (anchor links) — fixes `javabean-admin2/undefined` toast from action-only menubar API
    * **Menubar:** No writes to `user/config/admin-next.yaml` (good Grav citizen)
    * **Menubar:** Mambo Desktop shortcut included when Operator Dock is not installed

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
## 05/31/2026

1. [](#improved)
    * **Menubar:** Team DC header shortcuts (MUD Editor, GetGRAV!, Mud Bazaar) via `onApiMenubarItems`
    * **Menubar:** Opt-in toggle `inject_menubar_links` (default off for GPM)

# v1.0.0
## 05/30/2026

1. [](#new)
    * Initial release — twelve Admin2 theme presets, paint shop, JavaBean boot CSS
