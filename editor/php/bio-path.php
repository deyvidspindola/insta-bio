<?php

if (!function_exists('bio_path_client_root_from_editor')) {
  function bio_path_client_root_from_editor(): string
  {
    return dirname(__DIR__);
  }
}

if (!function_exists('bio_path_json_file')) {
  function bio_path_json_file(string $clientRoot): string
  {
    return rtrim($clientRoot, '/\\') . DIRECTORY_SEPARATOR . 'bio-path.json';
  }
}

if (!function_exists('bio_path_to_relative')) {
  /**
   * Caminho relativo à raiz do site (ex.: painel/bio.json).
   */
  function bio_path_to_relative(string $absoluteBioPath, string $clientRoot): string
  {
    $bioPath = str_replace('\\', '/', $absoluteBioPath);
    $bioReal = realpath($bioPath);
    if ($bioReal !== false) {
      $bioPath = str_replace('\\', '/', $bioReal);
    }

    $clientReal = realpath($clientRoot);
    $clientPath = rtrim(str_replace('\\', '/', $clientReal !== false ? $clientReal : $clientRoot), '/');
    if ($clientPath !== '' && str_starts_with($bioPath, $clientPath . '/')) {
      return ltrim(substr($bioPath, strlen($clientPath)), '/');
    }

    return 'bio-json.php';
  }
}

if (!function_exists('write_bio_path_json')) {
  function write_bio_path_json(string $clientRoot, string $absoluteBioPath): void
  {
    $relativePath = bio_path_to_relative($absoluteBioPath, $clientRoot);
    $payload = [
      'bioJsonPath' => $relativePath,
      'updatedAt' => date('c'),
    ];

    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
      return;
    }

    file_put_contents(bio_path_json_file($clientRoot), $json . "\n");
  }
}

if (!function_exists('read_bio_path_json_relative')) {
  function read_bio_path_json_relative(string $clientRoot): ?string
  {
    $file = bio_path_json_file($clientRoot);
    if (!is_file($file)) {
      return null;
    }

    $raw = file_get_contents($file);
    if ($raw === false || $raw === '') {
      return null;
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
      return null;
    }

    $relative = trim((string) ($data['bioJsonPath'] ?? ''));
    if ($relative !== '') {
      return $relative;
    }

    $legacy = trim((string) ($data['bioJsonUrl'] ?? ''));
    return $legacy !== '' ? ltrim($legacy, '/') : null;
  }
}

if (!function_exists('bio_path_to_web_url')) {
  /** @deprecated Use bio_path_to_relative */
  function bio_path_to_web_url(string $absoluteBioPath, string $clientRoot): string
  {
    return bio_path_to_relative($absoluteBioPath, $clientRoot);
  }
}
