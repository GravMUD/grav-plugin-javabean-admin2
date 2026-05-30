<?php



declare(strict_types=1);



namespace Grav\Plugin\JavaBeanAdmin2;



/**

 * Builds CSS that maps JavaBean preset tokens onto Admin2 semantic variables.

 * Respects Andy's light / dark / system switcher via :root + .dark pairs.

 */

class JavaBeanThemeEngine

{

    /** @param array<string, mixed> $pluginConfig */

    public function buildCss(array $pluginConfig): string

    {

        if (empty($pluginConfig['enabled'])) {

            return '';

        }



        $slug = (string) ($pluginConfig['active_preset'] ?? 'javabean-classic');

        $preset = JavaBeanPresetRegistry::get($slug) ?? JavaBeanPresetRegistry::get('javabean-classic');

        if ($preset === null) {

            return '';

        }



        $styling = $this->normalizeStyling(

            is_array($pluginConfig['styling'] ?? null) ? $pluginConfig['styling'] : [],

            $pluginConfig

        );



        $fontKey = (string) ($preset['fontFamily'] ?? 'jost');

        if (array_key_exists('usePresetFont', $styling) && $styling['usePresetFont'] === false && !empty($styling['fontFamily'])) {

            $fontKey = (string) $styling['fontFamily'];

        }



        $stacks = JavaBeanPresetRegistry::fontStacks();

        $fontStack = $stacks[$fontKey] ?? $stacks['jost'];



        $tokens = is_array($preset['tokens'] ?? null) ? $preset['tokens'] : [];

        $light = is_array($tokens['light'] ?? null) ? $tokens['light'] : [];

        $dark = is_array($tokens['dark'] ?? null) ? $tokens['dark'] : [];



        if (empty($styling['usePresetAccent'])) {

            $accent = sprintf(

                'hsl(%d %d%% 55%%)',

                (int) ($styling['accentHue'] ?? 271),

                (int) ($styling['accentSaturation'] ?? 91)

            );

            $light['primary'] = $accent;

            $dark['primary'] = $accent;

        }



        $density = (string) ($styling['density'] ?? 'comfy');

        $radiusKey = (string) ($styling['radius'] ?? 'default');



        $radius = match ($radiusKey) {

            'subtle' => '0.35rem',

            'round' => '1rem',

            default => match ($density) {

                'compact' => '0.4rem',

                'spacious' => '0.85rem',

                default => '0.625rem',

            },

        };



        $spacing = match ($density) {

            'compact' => '0.85',

            'spacious' => '1.12',

            default => '1',

        };



        $customCss = trim((string) ($styling['customCss'] ?? ''));



        $css = "/* JavaBean for Admin2 — {$preset['name']} */\n";

        $css .= ":root {\n";

        $css .= $this->tokenBlock($light, $fontStack, $radius, $spacing);

        $css .= "}\n\n";

        $css .= ".dark {\n";

        $css .= $this->tokenBlock($dark, $fontStack, $radius, $spacing);

        $css .= "}\n";



        if ($customCss !== '') {

            $css .= "\n/* JavaBean custom CSS */\n" . $customCss . "\n";

        }



        return $css;

    }



    /**

     * @param array<string, mixed> $styling

     * @param array<string, mixed> $legacyCfg

     * @return array<string, mixed>

     */

    private function normalizeStyling(array $styling, array $legacyCfg = []): array

    {

        if ($styling === [] && (isset($legacyCfg['density']) || isset($legacyCfg['custom_css']))) {

            $styling = [

                'density' => (string) ($legacyCfg['density'] ?? 'comfy'),

                'customCss' => (string) ($legacyCfg['custom_css'] ?? ''),

            ];

        }



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



        return array_merge($defaults, $styling);

    }



    /**

     * @param array<string, string> $tokens

     */

    private function tokenBlock(array $tokens, string $fontStack, string $radius, string $spacing): string

    {

        $bg = $tokens['background'] ?? 'hsl(0 0% 100%)';

        $fg = $tokens['foreground'] ?? 'hsl(240 10% 4%)';

        $primary = $tokens['primary'] ?? 'hsl(271 91% 55%)';

        $sidebar = $tokens['sidebar'] ?? $bg;

        $border = $tokens['border'] ?? 'hsl(240 6% 90%)';

        $muted = $tokens['muted'] ?? $sidebar;

        $mutedFg = $tokens['mutedForeground'] ?? $fg;



        $lines = [

            "  --background: {$bg};",

            "  --foreground: {$fg};",

            "  --card: {$bg};",

            "  --card-foreground: {$fg};",

            "  --popover: {$bg};",

            "  --popover-foreground: {$fg};",

            "  --primary: {$primary};",

            "  --primary-foreground: hsl(0 0% 100%);",

            "  --secondary: {$muted};",

            "  --secondary-foreground: {$fg};",

            "  --muted: {$muted};",

            "  --muted-foreground: {$mutedFg};",

            "  --accent: {$muted};",

            "  --accent-foreground: {$fg};",

            "  --border: {$border};",

            "  --input: {$border};",

            "  --sidebar: {$sidebar};",

            "  --sidebar-foreground: {$fg};",

            "  --sidebar-primary: {$primary};",

            "  --sidebar-primary-foreground: hsl(0 0% 100%);",

            "  --sidebar-accent: {$muted};",

            "  --sidebar-accent-foreground: {$fg};",

            "  --sidebar-border: {$border};",

            "  --radius: {$radius};",

            "  --font-sans: {$fontStack};",

            "  --javabean-density: {$spacing};",

        ];



        return implode("\n", $lines) . "\n";

    }



    /** @return array<int, array<string, mixed>> */

    public function presetsForClient(): array

    {

        $stacks = JavaBeanPresetRegistry::fontStacks();

        require_once __DIR__ . '/JavaBeanFontCatalog.php';

        $catalog = JavaBeanFontCatalog::all();

        $out = [];



        foreach (JavaBeanPresetRegistry::all() as $preset) {

            $fontKey = (string) ($preset['fontFamily'] ?? 'jost');

            $out[] = [

                'slug' => $preset['slug'],

                'name' => $preset['name'],

                'tagline' => $preset['tagline'] ?? '',

                'fontFamily' => $fontKey,

                'fontLabel' => $catalog[$fontKey]['label'] ?? ucwords(str_replace('-', ' ', $fontKey)),

                'fontStack' => $stacks[$fontKey] ?? $stacks['jost'],

                'tokens' => $preset['tokens'] ?? [],

                'accentDefault' => $preset['accentDefault'] ?? null,

            ];

        }



        return $out;

    }

}


