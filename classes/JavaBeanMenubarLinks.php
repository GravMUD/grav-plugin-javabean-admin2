<?php

declare(strict_types=1);

namespace Grav\Plugin\JavaBeanAdmin2;

use Grav\Common\Grav;

/**
 * Runtime Team DC header shortcuts via onApiMenubarItems (no admin-next.yaml writes).
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
                'url' => 'https://getgrav.live',
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
        if (!$this->shouldInject($grav)) {
            return [];
        }

        $items = [];
        foreach (self::defaultLinks() as $index => $link) {
            $url = trim((string) ($link['url'] ?? ''));
            $label = trim((string) ($link['label'] ?? ''));
            if ($url === '' || $label === '') {
                continue;
            }

            $items[] = [
                'id' => 'javabean-link-' . substr(md5(strtolower($url) . '|' . strtolower($label)), 0, 12),
                'plugin' => 'javabean-admin2',
                'label' => $label,
                'icon' => trim((string) ($link['icon'] ?? 'fa-link')) ?: 'fa-link',
                'url' => $url,
                'external' => !empty($link['external']),
                'priority' => 40 + $index,
            ];
        }

        return $items;
    }
}
