<?php

declare(strict_types=1);

namespace Grav\Plugin\JavaBeanAdmin2;

use Grav\Common\Grav;

/**
 * Runtime Team DC header shortcuts via onApiAdminPreferencesResolved (no admin-next.yaml writes).
 */
class JavaBeanMenubarLinks
{
    /** @return array<int, array<string, mixed>> */
    public static function defaultLinks(): array
    {
        return [
            [
                'label' => 'MUD Editor',
                'url' => '/plugin/grav-mud-admin',
                'icon' => 'fa-wand-magic-sparkles',
                'external' => false,
            ],
            [
                'label' => 'GetGRAV!',
                'url' => 'https://gravfans.live',
                'icon' => 'fa-rocket',
                'external' => true,
            ],
            [
                'label' => 'Mud Bazaar',
                'url' => 'https://gravmud.site/marketplace',
                'icon' => 'fa-store',
                'external' => true,
            ],
        ];
    }

    public function shouldInject(Grav $grav): bool
    {
        if (!JavaBeanLegacy::isEnabled($grav)) {
            return false;
        }

        return (bool) (JavaBeanLegacy::config($grav)['inject_menubar_links'] ?? false);
    }

    /** @return list<array<string, mixed>> */
    public function apiItems(Grav $grav): array
    {
        // URL shortcuts are merged via onApiAdminPreferencesResolved — Admin2
        // menubar API items are action-only (buttons), not navigational links.
        return [];
    }

    /** @return list<array<string, mixed>> */
    public static function preferenceLinks(Grav $grav): array
    {
        $self = new self();
        if (!$self->shouldInject($grav)) {
            return [];
        }

        $adminRoute = trim((string) $grav['config']->get('plugins.admin2.route', '/admin'), '/');
        /** @var \Grav\Common\Uri $uri */
        $uri = $grav['uri'];
        $root = rtrim($uri->rootUrl(false), '/');
        $adminDir = GRAV_ROOT . '/user/plugins/grav-mud-admin';
        $links = [];

        foreach (self::defaultLinks() as $link) {
            $url = trim((string) ($link['url'] ?? ''));
            $label = trim((string) ($link['label'] ?? ''));
            if ($url === '' || $label === '') {
                continue;
            }
            if ($label === 'MUD Editor' && !is_dir($adminDir)) {
                continue;
            }
            if ($url === '/plugin/grav-mud-admin' || str_starts_with($url, '/plugin/grav-mud-admin')) {
                $url = $root . '/' . $adminRoute . '/plugin/grav-mud-admin';
            }

            $links[] = [
                'label' => $label,
                'url' => $url,
                'icon' => trim((string) ($link['icon'] ?? 'fa-link')) ?: 'fa-link',
                'external' => !empty($link['external']),
            ];
        }

        return $links;
    }

    /** @param array<int, array<string, mixed>> $links
     * @return list<array<string, mixed>>
     */
    public static function uniqueLinks(array $links): array
    {
        $seen = [];
        $out = [];
        foreach ($links as $link) {
            if (!is_array($link)) {
                continue;
            }
            $url = trim((string) ($link['url'] ?? ''));
            $label = trim((string) ($link['label'] ?? ''));
            if ($url === '' || $label === '') {
                continue;
            }
            $key = strtolower($url) . '|' . strtolower($label);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = [
                'label' => $label,
                'url' => $url,
                'icon' => trim((string) ($link['icon'] ?? 'fa-link')) ?: 'fa-link',
                'external' => !empty($link['external']),
            ];
        }

        return $out;
    }

    /** @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function mergeIntoPayload(array $payload, Grav $grav): array
    {
        $runtime = self::preferenceLinks($grav);
        if (self::mamboDesktopInjecting($grav) && !self::operatorDockEnabled($grav)) {
            $runtime = self::uniqueLinks(array_merge($runtime, [self::mamboDesktopLink($grav)]));
        }
        if ($runtime === []) {
            return $payload;
        }

        $effective = is_array($payload['effective'] ?? null) ? $payload['effective'] : [];
        $existing = is_array($effective['menubarLinks'] ?? null) ? $effective['menubarLinks'] : [];
        $effective['menubarLinks'] = self::uniqueLinks(array_merge($existing, $runtime));
        $payload['effective'] = $effective;

        return $payload;
    }

    private static function operatorDockEnabled(Grav $grav): bool
    {
        $cfg = (array) $grav['config']->get('plugins.operator-dock-admin2', []);

        return !empty($cfg['enabled']);
    }

    private static function mamboDesktopInjecting(Grav $grav): bool
    {
        $cfg = (array) $grav['config']->get('plugins.mambo-desktop-admin2', []);

        return !empty($cfg['enabled']) && !empty($cfg['show_menubar_shortcut']);
    }

    /** @return array<string, mixed> */
    private static function mamboDesktopLink(Grav $grav): array
    {
        $adminRoute = trim((string) $grav['config']->get('plugins.admin2.route', '/admin'), '/');
        /** @var \Grav\Common\Uri $uri */
        $uri = $grav['uri'];
        $root = rtrim($uri->rootUrl(false), '/');

        return [
            'label' => 'Mambo Desktop',
            'url' => $root . '/' . $adminRoute . '/plugin/mambo-desktop-admin2',
            'icon' => 'fa-desktop',
            'external' => false,
        ];
    }
}
