<?php

declare(strict_types=1);

namespace Grav\Plugin\JavaBeanAdmin2;

use Grav\Common\Grav;
use RocketTheme\Toolbox\File\YamlFile;

/**
 * Slug rename grav-javabean-admin2 → javabean-admin2 (1.1.0) with one-time config migration.
 */
final class JavaBeanLegacy
{
    public const SLUG = 'javabean-admin2';

    public const LEGACY_SLUG = 'grav-javabean-admin2';

    public static function maybeMigrate(Grav $grav): void
    {
        self::migratePluginConfigFile($grav);
        self::migrateSystemYaml($grav);
    }

    public static function pluginDir(): string
    {
        $new = GRAV_ROOT . '/user/plugins/' . self::SLUG;
        if (is_dir($new)) {
            return $new;
        }

        return GRAV_ROOT . '/user/plugins/' . self::LEGACY_SLUG;
    }

    /** @return array<string, mixed> */
    public static function config(Grav $grav): array
    {
        $cfg = (array) $grav['config']->get('plugins.' . self::SLUG, []);
        if ($cfg !== []) {
            return $cfg;
        }

        return (array) $grav['config']->get('plugins.' . self::LEGACY_SLUG, []);
    }

    public static function isEnabled(Grav $grav): bool
    {
        return (bool) (self::config($grav)['enabled'] ?? false);
    }

    public static function configFilePath(Grav $grav): string
    {
        $dir = $grav['locator']->findResource('user://config/plugins', true, true);
        if (!$dir) {
            throw new \RuntimeException('Unable to resolve plugin config path.');
        }

        return $dir . '/' . self::SLUG . '.yaml';
    }

    private static function migratePluginConfigFile(Grav $grav): void
    {
        $dir = $grav['locator']->findResource('user://config/plugins', true, true);
        if (!$dir) {
            return;
        }

        $legacy = $dir . '/' . self::LEGACY_SLUG . '.yaml';
        $current = $dir . '/' . self::SLUG . '.yaml';
        if (is_file($legacy) && !is_file($current)) {
            @rename($legacy, $current);
            $grav['config']->reload();
        }
    }

    private static function migrateSystemYaml(Grav $grav): void
    {
        $path = $grav['locator']->findResource('user://config/system.yaml', true, true);
        if (!$path || !is_file($path)) {
            return;
        }

        $file = YamlFile::instance($path);
        $data = (array) $file->content();
        $plugins = is_array($data['plugins'] ?? null) ? $data['plugins'] : [];
        if (!array_key_exists(self::LEGACY_SLUG, $plugins)) {
            $file->free();

            return;
        }

        if (!array_key_exists(self::SLUG, $plugins)) {
            $plugins[self::SLUG] = $plugins[self::LEGACY_SLUG];
        }
        unset($plugins[self::LEGACY_SLUG]);
        $data['plugins'] = $plugins;
        $file->save($data);
        $file->free();
        $grav['config']->reload();
    }
}
