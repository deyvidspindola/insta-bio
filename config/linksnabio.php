<?php

return [
    'platform_host' => env('PLATFORM_HOST', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost'),

    'cname_target' => env('PLATFORM_CNAME', 'cname.linksnabio.app.br'),

    'reserved_slugs' => [
        'panel', 'editor', 'api', 'assets', '_template', 'template', 'admin', 'www',
        'mail', 'ftp', 'cdn', 'static', 'public', 'release', 'precos', 'pricing',
        'login', 'signup', 'cadastro', 'contato', 'sobre', 'blog', 'docs', 'status',
        'health', 'up', 'app', 'onboarding', 'auth', 'logout', 'storage', 'build',
        'configuracoes', 'billing', 'webhooks', 'preview', 'register', 'password',
        'email', 'verify', 'sanctum', 'horizon', 'telescope', 'livewire',
    ],

    'plans' => [
        'free' => [
            'name' => 'Free',
            'max_links' => 8,
            'templates' => ['classic', 'pill', 'soft'],
            'watermark' => true,
            'custom_domain' => false,
            'max_images' => 5,
            'max_image_bytes' => 2 * 1024 * 1024,
            'analytics_days' => 7,
        ],
        'pro' => [
            'name' => 'Pro',
            'max_links' => null,
            'templates' => ['classic', 'pill', 'outline', 'solid', 'glass', 'soft'],
            'watermark' => false,
            'custom_domain' => true,
            'max_images' => 50,
            'max_image_bytes' => 10 * 1024 * 1024,
            'analytics_days' => 90,
        ],
    ],

    'pro_price' => (float) env('MP_PRO_PRICE', 29.90),
    'pro_currency' => env('MP_PRO_CURRENCY', 'BRL'),
];
