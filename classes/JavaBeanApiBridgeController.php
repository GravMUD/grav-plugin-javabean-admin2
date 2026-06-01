<?php

declare(strict_types=1);

namespace Grav\Plugin\JavaBeanAdmin2;

use Grav\Common\Grav;
use Grav\Framework\Psr7\Response;
use Grav\Plugin\Api\Controllers\AbstractApiController;
use Grav\Plugin\Api\Response\ApiResponse;
use Grav\Plugin\Api\Response\ErrorResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use RocketTheme\Toolbox\File\YamlFile;

class JavaBeanApiBridgeController extends AbstractApiController
{
    public function presets(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'api.access');
        require_once __DIR__ . '/JavaBeanFontCatalog.php';
        return ApiResponse::create([
            'presets' => $this->engine()->presetsForClient(),
            'fonts' => JavaBeanFontCatalog::forClient(),
        ]);
    }

    public function fonts(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'api.access');
        require_once __DIR__ . '/JavaBeanFontCatalog.php';
        return ApiResponse::create(['fonts' => JavaBeanFontCatalog::forClient()]);
    }

    public function settings(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'api.config.read');

        if ($request->getMethod() === 'GET') {
            return ApiResponse::create($this->readSettings());
        }

        if ($request->getMethod() === 'PATCH') {
            $this->requirePermission($request, 'api.config.write');
            $body = json_decode((string) $request->getBody(), true);
            if (!is_array($body)) {
                return ErrorResponse::create(400, 'Bad Request', 'Invalid JSON body');
            }
            $this->writeSettings($body);
            return ApiResponse::create($this->readSettings());
        }

        return ErrorResponse::create(405, 'Method Not Allowed', 'Use GET or PATCH');
    }

    public function themeCss(ServerRequestInterface $request): ResponseInterface
    {
        $this->requirePermission($request, 'api.access');

        $cfg = (array) $this->config->get('plugins.grav-javabean-admin2', []);
        $query = $request->getQueryParams();
        if (!empty($query['preset'])) {
            $cfg['active_preset'] = (string) $query['preset'];
        }

        $css = $this->engine()->buildCss($cfg);

        return new Response(200, [
            'Content-Type' => 'text/css; charset=UTF-8',
            'Cache-Control' => 'no-cache',
        ], $css);
    }

    private function engine(): JavaBeanThemeEngine
    {
        require_once __DIR__ . '/JavaBeanPresetRegistry.php';
        require_once __DIR__ . '/JavaBeanThemeEngine.php';
        return new JavaBeanThemeEngine();
    }

    /** @return array<string, mixed> */
    private function readSettings(): array
    {
        $cfg = (array) $this->config->get('plugins.grav-javabean-admin2', []);
        $styling = $this->normalizeStyling(
            is_array($cfg['styling'] ?? null) ? $cfg['styling'] : [],
            $cfg
        );

        return [
            'presets' => [
                'enabled' => (bool) ($cfg['enabled'] ?? true),
                'active_preset' => (string) ($cfg['active_preset'] ?? 'javabean-classic'),
            ],
            'advanced' => [
                'styling' => $styling,
            ],
        ];
    }

    /** @param array<string, mixed> $patch */
    private function writeSettings(array $patch): void
    {
        require_once __DIR__ . '/JavaBeanPresetRegistry.php';

        $patch = $this->flattenSettingsPatch($patch);
        $allowed = ['enabled', 'active_preset', 'inject_menubar_links', 'styling'];
        $current = $this->internalSettings();

        foreach ($allowed as $key) {
            if (!array_key_exists($key, $patch)) {
                continue;
            }
            if ($key === 'styling' && is_array($patch[$key])) {
                $current['styling'] = $this->normalizeStyling($patch[$key], $current);
                continue;
            }
            $current[$key] = $patch[$key];
        }

        if (!JavaBeanPresetRegistry::get((string) $current['active_preset'])) {
            $current['active_preset'] = 'javabean-classic';
        }

        $path = $this->grav['locator']->findResource('user://config/plugins', true, true);
        if (!$path) {
            throw new \RuntimeException('Unable to resolve plugin config path.');
        }

        $file = YamlFile::instance($path . '/grav-javabean-admin2.yaml');
        $data = $file->exists() ? (array) $file->content() : [];
        $data['enabled'] = (bool) $current['enabled'];
        $data['active_preset'] = (string) $current['active_preset'];
        $data['inject_menubar_links'] = (bool) ($current['inject_menubar_links'] ?? false);
        $data['styling'] = $current['styling'];
        unset($data['density'], $data['custom_css']);
        $file->save($data);
        $file->free();

        $this->config->reload();
    }

    /** @return array<string, mixed> */
    private function internalSettings(): array
    {
        $cfg = (array) $this->config->get('plugins.grav-javabean-admin2', []);

        return [
            'enabled' => (bool) ($cfg['enabled'] ?? true),
            'active_preset' => (string) ($cfg['active_preset'] ?? 'javabean-classic'),
            'inject_menubar_links' => (bool) ($cfg['inject_menubar_links'] ?? false),
            'styling' => $this->normalizeStyling(
                is_array($cfg['styling'] ?? null) ? $cfg['styling'] : [],
                $cfg
            ),
        ];
    }

    /** @param array<string, mixed> $patch */
    private function flattenSettingsPatch(array $patch): array
    {
        if (isset($patch['presets']) && is_array($patch['presets'])) {
            if (array_key_exists('enabled', $patch['presets'])) {
                $patch['enabled'] = $patch['presets']['enabled'];
            }
            if (array_key_exists('active_preset', $patch['presets'])) {
                $patch['active_preset'] = $patch['presets']['active_preset'];
            }
        }

        if (isset($patch['advanced']) && is_array($patch['advanced'])) {
            if (isset($patch['advanced']['styling']) && is_array($patch['advanced']['styling'])) {
                $patch['styling'] = $patch['advanced']['styling'];
            }
        }

        if (array_key_exists('enabled', $patch)) {
            $patch['enabled'] = filter_var($patch['enabled'], FILTER_VALIDATE_BOOLEAN);
        }

        return $patch;
    }

    /**
     * @param array<string, mixed> $styling
     * @param array<string, mixed> $legacyCfg
     * @return array<string, mixed>
     */
    private function normalizeStyling(array $styling, array $legacyCfg = []): array
    {
        $defaults = [
            'accentHue' => null,
            'accentSaturation' => null,
            'usePresetAccent' => true,
            'density' => 'comfy',
            'fontFamily' => null,
            'usePresetFont' => true,
            'radius' => 'default',
            'customCss' => '',
        ];

        if ($styling === [] && (isset($legacyCfg['density']) || isset($legacyCfg['custom_css']))) {
            $styling = [
                'density' => (string) ($legacyCfg['density'] ?? 'comfy'),
                'customCss' => (string) ($legacyCfg['custom_css'] ?? ''),
            ];
        }

        $merged = array_merge($defaults, $styling);

        $density = (string) ($merged['density'] ?? 'comfy');
        if (!in_array($density, ['compact', 'comfy', 'spacious'], true)) {
            $merged['density'] = 'comfy';
        }

        $radius = (string) ($merged['radius'] ?? 'default');
        if (!in_array($radius, ['subtle', 'default', 'round'], true)) {
            $merged['radius'] = 'default';
        }

        if (!empty($merged['usePresetAccent'])) {
            $merged['accentHue'] = null;
            $merged['accentSaturation'] = null;
        } else {
            $merged['accentHue'] = is_numeric($merged['accentHue'] ?? null)
                ? max(0, min(360, (int) $merged['accentHue']))
                : 271;
            $merged['accentSaturation'] = is_numeric($merged['accentSaturation'] ?? null)
                ? max(0, min(100, (int) $merged['accentSaturation']))
                : 91;
        }

        if (!empty($merged['usePresetFont'])) {
            $merged['fontFamily'] = null;
        } else {
            $font = (string) ($merged['fontFamily'] ?? 'jost');
            require_once __DIR__ . '/JavaBeanFontCatalog.php';
            $merged['fontFamily'] = JavaBeanFontCatalog::isValid($font) ? $font : 'jost';
        }

        $merged['customCss'] = (string) ($merged['customCss'] ?? '');

        return $merged;
    }
}
