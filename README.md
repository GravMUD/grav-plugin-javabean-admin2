# JavaBean for Admin2

**Site:** [javabean.gravmud.site](https://javabean.gravmud.site) · **Repo:** [GravMUD/grav-plugin-grav-javabean-admin2](https://github.com/GravMUD/grav-plugin-grav-javabean-admin2)

**Free Admin2 theming for Grav 2.0** — twelve preset cockpits, light/dark pairs, Andy's appearance switcher compatible.

> *Backend templating — 2004 called, it wants its pun back.*

JavaBean layers on [Admin2](https://github.com/getgrav/grav-plugin-admin2). It does **not** replace Settings → Appearance. It ships curated token packs and a Paint Shop for power users who want a cockpit without forking SvelteKit.

**License:** MIT — free forever. Commercial GravMUD plugins (Commentz, Forumz, Marketplace, etc.) are separate products and are **not** part of this repository.

## Requirements

| Package | Version |
|---------|---------|
| [Grav](https://github.com/getgrav/grav) | `>=2.0.0` |
| [Admin2](https://github.com/getgrav/grav-plugin-admin2) | `>=1.0.0` |
| [API](https://github.com/getgrav/grav-plugin-api) | `>=1.0.0` |

## Installation

### GPM (once listed)

```bash
bin/gpm install grav-javabean-admin2
```

### Manual

1. Download the latest release zip.
2. Extract to `user/plugins/grav-javabean-admin2`.
3. Clear cache: `bin/grav cache` or Admin2 → Clear Cache.
4. Enable **JavaBean for Admin2** in Admin2 → Plugins.

## Configuration

Open **Admin2 → JavaBean** (sidebar) or **Settings → JavaBean Themes**.

| Setting | Description |
|---------|-------------|
| **Theme preset** | Card grid — click to preview and save |
| **Paint Shop** | Accent override, density, font, corner radius, custom CSS |
| **Menubar shortcuts** | Optional — merge custom links into Admin2 header (see below) |

Presets include serif and monospace faces (Grav Cathedral, Midnight Ops, EvvyTink Terminal, etc.). Fonts load from Google Fonts when selected.

### Team DC header shortcuts

When enabled (default), JavaBean merges live shortcuts into Admin2 `menubarLinks`:

| Icon | Label | URL |
|------|-------|-----|
| ✨ | EvvyTink | https://gravmud.site/services |
| 🚀 | GetGRAV! | https://getgrav.live |
| 🏪 | Mud Bazaar | https://gravmud.site/marketplace |

Edit `JavaBeanMenubarLinks::defaultLinks()` to customize.

### Andy compatibility

JavaBean respects Admin2's built-in controls:

- Light / dark / system (`colorMode`)
- Accent hue and saturation
- Font family (Andy fonts sync to preferences; JavaBean-only fonts apply via CSS variables)

Uninstalling JavaBean returns stock Admin2 chrome. Andy's switcher is untouched.

## Development

```bash
# From your Grav root — symlink or copy the plugin folder
user/plugins/grav-javabean-admin2/
```

Custom Admin2 fields live under `admin-next/fields/`. After JS changes, hard-refresh Admin2 (failed field loads are cached in session).

Build a release zip from the GRAV-MUD monorepo:

```powershell
.\scripts\build-javabean-gpm.ps1
```

## GPM submission

This plugin is intended for the [Grav Package Manager](https://learn.getgrav.org/advanced/grav-development#theme-plugin-release-process):

1. MIT `LICENSE`
2. This `README.md`
3. `blueprints.yaml` with metadata and dependencies
4. `CHANGELOG.md` in Grav changelog format
5. GitHub release tag (semver, e.g. `1.0.0`)
6. Issue on [getgrav/grav](https://github.com/getgrav/grav/issues) with repo URL for first-time listing

## Attribution

- **Admin2** — Trilby Media / Grav community
- **Google Fonts** — individual fonts under their respective [SIL OFL](https://openfontlicense.org/) or Apache licenses (Inter, Public Sans, Nunito Sans, Jost, Space Grotesk, Outfit, Raleway, Sora, Lora, Merriweather, Bitter, JetBrains Mono, Fira Code)

## Author

**FutureVision Labs · Team DC**  
Damian Caynes — [gravmud.site](https://gravmud.site)
