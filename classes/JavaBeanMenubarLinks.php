<?php

declare(strict_types=1);

namespace Grav\Plugin\JavaBeanAdmin2;

use Grav\Common\Grav;
use RocketTheme\Toolbox\File\YamlFile;

/**
 * Merges Team DC header shortcut icons into admin-next menubarLinks.
 */
class JavaBeanMenubarLinks
{
    /** @return array<int, array<string, mixed>> */
    public static function defaultLinks(): array
    {
        return [
            [
                'label' => 'EvvyTink',
                'url' => 'https://gravmud.site/services',
                'icon' => 'fa-wand-magic-sparkles',
                'external' => true,
            ],
            [
                'label' => 'GetGRAV!',
                'url' => 'https://goggrav.live',
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

    public function mergeTeamDcLinks(Grav $grav): void
    {
        if (!(bool) $grav['config']->get('plugins.grav-javabean-admin2.inject_menubar_links', true)) {
            return;
        }

        $path = $grav['locator']->findResource('user://config/admin-next.yaml', true, true);
        if (!$path || !is_file($path)) {
            $path = $grav['locator']->findResource('user://config', true, true);
            if (!$path) {
                return;
            }
            $path .= '/admin-next.yaml';
        }

        $file = YamlFile::instance($path);
        $data = $file->exists() ? (array) $file->content() : [];
        $ui = is_array($data['ui'] ?? null) ? $data['ui'] : [];
        $settings = is_array($ui['settings'] ?? null) ? $ui['settings'] : [];
        $existing = is_array($settings['menubarLinks'] ?? null) ? $settings['menubarLinks'] : [];

        $merged = $this->mergeUnique($existing, self::defaultLinks());
        if ($merged === $existing) {
            $file->free();
            return;
        }

        $settings['menubarLinks'] = $merged;
        $ui['settings'] = $settings;
        $data['ui'] = $ui;
        $file->save($data);
        $file->free();

        $grav['config']->reload();
    }

    /**
     * @param array<int, array<string, mixed>> $existing
     * @param array<int, array<string, mixed>> $toAdd
     * @return array<int, array<string, mixed>>
     */
    private function mergeUnique(array $existing, array $toAdd): array
    {
        $keys = [];
        foreach ($existing as $link) {
            $keys[$this->linkKey($link)] = true;
        }

        $out = $existing;
        foreach ($toAdd as $link) {
            $key = $this->linkKey($link);
            if (isset($keys[$key])) {
                continue;
            }
            $keys[$key] = true;
            $out[] = $link;
        }

        return $out;
    }

    /** @param array<string, mixed> $link */
    private function linkKey(array $link): string
    {
        return strtolower((string) ($link['url'] ?? '')) . '|' . strtolower((string) ($link['label'] ?? ''));
    }
}
