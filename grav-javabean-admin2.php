<?php

namespace Grav\Plugin;

use Grav\Common\Plugin;
use Grav\Plugin\JavaBeanAdmin2\JavaBeanAdminShell;
use Grav\Plugin\JavaBeanAdmin2\JavaBeanApiBridgeController;
use Grav\Plugin\JavaBeanAdmin2\JavaBeanMenubarLinks;
use Grav\Plugin\JavaBeanAdmin2\JavaBeanThemeEngine;
use RocketTheme\Toolbox\Event\Event;

class GravJavabeanAdmin2Plugin extends Plugin
{
    private ?JavaBeanThemeEngine $engine = null;

    public static function getSubscribedEvents(): array
    {
        $events = [
            'onPluginsInitialized' => [['onPluginsInitializedEarly', 100000]],
            'onPagesInitialized' => ['onPagesInitializedEarly', 1001],
        ];

        if (self::supportsGravApiBridge()) {
            $events['onApiRegisterRoutes'] = ['onApiRegisterRoutes', 0];
            $events['onApiAdminSettingsPanels'] = ['onApiAdminSettingsPanels', 0];
            $events['onApiSidebarItems'] = ['onApiSidebarItems', 0];
            $events['onApiPluginPageInfo'] = ['onApiPluginPageInfo', 0];
            $events['onApiMenubarItems'] = ['onApiMenubarItems', 0];
        }

        return $events;
    }

    public function onPluginsInitializedEarly(): void
    {
        if (!self::supportsGravApiBridge()) {
            return;
        }

        $this->loadClasses();
    }

    public function onApiMenubarItems(Event $event): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $user = $event['user'] ?? null;
        if (!$user || !($user->get('access.api.access') || $user->get('access.api.super'))) {
            return;
        }

        $items = $event['items'] ?? [];
        foreach ((new JavaBeanMenubarLinks())->apiItems($this->grav) as $item) {
            $items[] = $item;
        }
        $event['items'] = $items;
    }

    public function onPagesInitializedEarly(): void
    {
        if (!$this->isEnabled() || !self::supportsGravApiBridge()) {
            return;
        }

        $this->loadClasses();
        (new JavaBeanAdminShell($this->grav, $this->themeEngine()))->maybeServe();
    }

    public function onApiRegisterRoutes(Event $event): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $this->loadClasses();

        $routes = $event['routes'];
        $controller = JavaBeanApiBridgeController::class;

        $routes->addRoute(['GET', 'OPTIONS'], '/javabean/presets', [$controller, 'presets']);
        $routes->addRoute(['GET', 'OPTIONS'], '/javabean/fonts', [$controller, 'fonts']);
        $routes->addRoute(['GET', 'PATCH', 'OPTIONS'], '/javabean/settings', [$controller, 'settings']);
        $routes->addRoute(['GET', 'OPTIONS'], '/javabean/theme.css', [$controller, 'themeCss']);
    }

    public function onApiSidebarItems(Event $event): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $user = $event['user'] ?? null;
        if (!$user || !($user->get('access.api.access') || $user->get('access.api.super'))) {
            return;
        }

        $items = $event['items'] ?? [];
        $items[] = [
            'id' => 'javabean-admin2',
            'plugin' => 'grav-javabean-admin2',
            'label' => 'JavaBean',
            'icon' => 'fa-mug-hot',
            'route' => '/plugin/grav-javabean-admin2',
            'priority' => 85,
        ];
        $event['items'] = $items;
    }

    public function onApiPluginPageInfo(Event $event): void
    {
        if (!$this->isEnabled() || ($event['plugin'] ?? '') !== 'grav-javabean-admin2') {
            return;
        }

        $user = $event['user'] ?? null;
        if (!$user || !($user->get('access.api.access') || $user->get('access.api.super'))) {
            return;
        }

        $event['definition'] = [
            'id' => 'javabean-admin2',
            'plugin' => 'grav-javabean-admin2',
            'title' => 'JavaBean Themes',
            'icon' => 'fa-mug-hot',
            'page_type' => 'blueprint',
            'blueprint' => 'grav-javabean-admin2',
            'data_endpoint' => '/javabean/settings',
            'save_endpoint' => '/javabean/settings',
            'actions' => [
                ['id' => 'save', 'label' => 'Save', 'icon' => 'fa-check', 'primary' => true],
            ],
        ];
    }

    public function onApiAdminSettingsPanels(Event $event): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $user = $event['user'] ?? null;
        if (!$user || !($user->get('access.api.access') || $user->get('access.api.super'))) {
            return;
        }

        $panels = $event['panels'] ?? [];
        $panels[] = [
            'id' => 'javabean-admin2',
            'plugin' => 'grav-javabean-admin2',
            'label' => 'JavaBean Themes',
            'description' => 'Admin2 cockpit paint — preset cards, light/dark pairs',
            'icon' => 'fa-mug-hot',
            'blueprint' => 'javabean-settings',
            'data_endpoint' => '/javabean/settings',
            'save_endpoint' => '/javabean/settings',
            'priority' => 15,
        ];
        $event['panels'] = $panels;
    }

    private function themeEngine(): JavaBeanThemeEngine
    {
        return $this->engine ??= new JavaBeanThemeEngine();
    }

    private function isEnabled(): bool
    {
        return (bool) $this->grav['config']->get('plugins.grav-javabean-admin2.enabled', false);
    }

    private function loadClasses(): void
    {
        require_once __DIR__ . '/classes/JavaBeanFontCatalog.php';
        require_once __DIR__ . '/classes/JavaBeanPresetRegistry.php';
        require_once __DIR__ . '/classes/JavaBeanThemeEngine.php';
        require_once __DIR__ . '/classes/JavaBeanAdminShell.php';
        require_once __DIR__ . '/classes/JavaBeanApiBridgeController.php';
        require_once __DIR__ . '/classes/JavaBeanMenubarLinks.php';
    }

    private static function supportsGravApiBridge(): bool
    {
        return class_exists(\Grav\Plugin\Api\ApiRouteCollector::class);
    }
}
