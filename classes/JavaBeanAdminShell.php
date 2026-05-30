<?php

declare(strict_types=1);

namespace Grav\Plugin\JavaBeanAdmin2;

use Grav\Common\Grav;

/**
 * Serves Admin2 SPA shell with JavaBean CSS + boot script injected.
 * Runs at onPagesInitialized priority 1001 — before admin2 (1000).
 */
class JavaBeanAdminShell
{
    private const BASE_PLACEHOLDER = '/__GRAV_ADMIN2_BASE__';

    public function __construct(
        private readonly Grav $grav,
        private readonly JavaBeanThemeEngine $engine,
    ) {}

    public function maybeServe(): void
    {
        $cfg = (array) $this->grav['config']->get('plugins.grav-javabean-admin2', []);
        if (empty($cfg['enabled'])) {
            return;
        }

        if (!$this->isAdmin2ShellRequest()) {
            return;
        }

        $indexFile = GRAV_ROOT . '/user/plugins/admin2/app/index.html';
        if (!is_file($indexFile)) {
            return;
        }

        /** @var \Grav\Common\Uri $uri */
        $uri = $this->grav['uri'];
        $adminRoute = trim((string) $this->grav['config']->get('plugins.admin2.route', '/admin'), '/');
        $rootPath = rtrim($uri->rootUrl(false), '/');
        $routeBase = $rootPath . '/' . $adminRoute;
        $assetsPath = $rootPath . '/user/plugins/admin2/app';

        $html = (string) file_get_contents($indexFile);
        $html = str_replace(
            ['"' . self::BASE_PLACEHOLDER . '"', self::BASE_PLACEHOLDER . '/'],
            ['"' . $routeBase . '"', $assetsPath . '/'],
            $html
        );

        $apiRoute = $this->grav['config']->get('plugins.api.route', '/api');
        $apiVersion = $this->grav['config']->get('plugins.api.version_prefix', 'v1');
        $serverUrl = rtrim($uri->rootUrl(true), '/');

        $config = json_encode([
            'serverUrl' => $serverUrl,
            'apiPrefix' => '/' . trim($apiRoute, '/') . '/' . trim($apiVersion, '/'),
            'basePath' => $routeBase,
            'environment' => $uri->environment(),
            'grav' => ['version' => GRAV_VERSION],
            'admin' => [
                'name' => 'Admin2',
                'version' => (string) $this->grav['config']->get('plugins.admin2.version', ''),
            ],
        ], JSON_UNESCAPED_SLASHES);

        $css = $this->engine->buildCss($cfg);
        $pluginBase = $rootPath . '/user/plugins/grav-javabean-admin2/assets';
        $presetSlug = htmlspecialchars((string) ($cfg['active_preset'] ?? 'javabean-classic'), ENT_QUOTES, 'UTF-8');

        require_once __DIR__ . '/JavaBeanFontCatalog.php';
        require_once __DIR__ . '/JavaBeanPresetRegistry.php';
        $fontsJson = json_encode(JavaBeanFontCatalog::forClient(), JSON_UNESCAPED_SLASHES);
        $fontKey = $this->resolveActiveFontKey($cfg);
        $fontMeta = JavaBeanFontCatalog::all()[$fontKey] ?? null;
        $googleFonts = '';
        if (!empty($fontMeta['google'])) {
            $spec = htmlspecialchars((string) $fontMeta['google'], ENT_QUOTES, 'UTF-8');
            $googleFonts = <<<HTML
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={$spec}&display=swap">

HTML;
        }

        $inject = <<<HTML
    <script>window.__GRAV_CONFIG__ = {$config};</script>
    <script>window.__JAVABEAN_FONTS__ = {$fontsJson};</script>
{$googleFonts}    <style id="javabean-theme" data-preset="{$presetSlug}">{$css}</style>
    <script src="{$pluginBase}/javabean-boot.js" defer></script>
    <link rel="stylesheet" href="{$pluginBase}/javabean-admin.css">
HTML;

        $html = str_replace('<head>', "<head>\n    " . $inject, $html);

        header('Content-Type: text/html; charset=UTF-8');
        echo $html;
        exit;
    }

    private function isAdmin2ShellRequest(): bool
    {
        if (!(bool) $this->grav['config']->get('plugins.admin2.enabled', true)) {
            return false;
        }

        /** @var \Grav\Common\Uri $uri */
        $uri = $this->grav['uri'];
        $adminRoute = trim((string) $this->grav['config']->get('plugins.admin2.route', '/admin'), '/');
        $base = '/' . $adminRoute;

        $currentRoute = $uri->route();
        $stripped = $uri->extension();
        if ($stripped && !str_ends_with($currentRoute, '.' . $stripped)) {
            $currentRoute .= '.' . $stripped;
        }

        if ($currentRoute !== $base && !str_starts_with($currentRoute, $base . '/')) {
            return false;
        }

        $subPath = substr($currentRoute, strlen($base));
        if ($subPath === '/_app/version.json') {
            return false;
        }

        foreach (['/_app/', '/fonts/'] as $skip) {
            if (str_starts_with($subPath, $skip)) {
                return false;
            }
        }

        if (in_array($subPath, ['/favicon.ico', '/robots.txt'], true)) {
            return false;
        }

        return true;
    }

    /** @param array<string, mixed> $cfg */
    private function resolveActiveFontKey(array $cfg): string
    {
        $slug = (string) ($cfg['active_preset'] ?? 'javabean-classic');
        $preset = JavaBeanPresetRegistry::get($slug);
        $fontKey = (string) ($preset['fontFamily'] ?? 'jost');
        $styling = is_array($cfg['styling'] ?? null) ? $cfg['styling'] : [];
        if (array_key_exists('usePresetFont', $styling) && $styling['usePresetFont'] === false && !empty($styling['fontFamily'])) {
            $fontKey = (string) $styling['fontFamily'];
        }
        return JavaBeanFontCatalog::isValid($fontKey) ? $fontKey : 'jost';
    }
}
