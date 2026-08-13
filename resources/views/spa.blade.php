<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ $title ?? 'Links na Bio' }}</title>
        @if (!empty($description))
            <meta name="description" content="{{ $description }}">
        @endif
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        @php
            $entries = [
                'site' => 'resources/js/site/main.tsx',
                'app' => 'resources/js/app/main.tsx',
                'editor' => 'resources/js/editor/main.tsx',
                'admin' => 'resources/js/admin/main.tsx',
            ];
        @endphp
        @viteReactRefresh
        @vite($entries[$entry])
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
