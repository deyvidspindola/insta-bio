<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ $title }}</title>
        <meta name="description" content="{{ $description }}">
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        @viteReactRefresh
        @vite('resources/js/bio/main.tsx')
    </head>
    <body>
        <div id="root"></div>
        <script>
            window.__BIO_CONFIG__ = @json($config);
            window.__ANALYTICS_KEY__ = @json($bio->analytics_key);
            window.__BIO_WATERMARK__ = @json($bio->showsWatermark());
        </script>
    </body>
</html>
