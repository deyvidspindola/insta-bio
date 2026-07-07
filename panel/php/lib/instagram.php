<?php

/** App ID público do site instagram.com (usado pelo próprio Instagram no navegador). */
const INSTAGRAM_WEB_APP_ID = '936619743392459';

function normalize_instagram_handle(string $input): string
{
  $value = trim($input);
  $value = ltrim($value, '@');
  $value = preg_replace('#^https?://(www\.)?instagram\.com/#i', '', $value) ?? $value;
  $value = trim($value, '/');
  $value = explode('/', $value)[0];
  $value = explode('?', $value)[0];

  if (!preg_match('/^[a-zA-Z0-9._]{1,30}$/', $value)) {
    throw new InvalidArgumentException('Usuário do Instagram inválido');
  }

  return strtolower($value);
}

function instagram_default_user_agent(): string
{
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}

/**
 * @return array{body: string, status: int, error: string, ok: bool}
 */
function instagram_http_get(string $url, array $extraHeaders = []): array
{
  $headers = array_merge([
    'User-Agent: ' . instagram_default_user_agent(),
    'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  ], $extraHeaders);

  $ch = curl_init($url);
  $options = [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_ENCODING => '',
  ];

  if (defined('CURL_IPRESOLVE_V4')) {
    $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
  }

  curl_setopt_array($ch, $options);

  $body = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $error = curl_error($ch);
  curl_close($ch);

  return [
    'body' => $body === false ? '' : (string) $body,
    'status' => $status,
    'error' => $error,
    'ok' => $body !== false && $status > 0 && $status < 400,
  ];
}

function instagram_request_failure_detail(array $response): string
{
  if ($response['error'] !== '') {
    return 'curl: ' . $response['error'];
  }

  if ($response['status'] > 0) {
    return 'HTTP ' . $response['status'];
  }

  return 'sem resposta';
}

function instagram_profile_from_user_payload(array $user, string $fallbackUsername): ?array
{
  $username = strtolower((string) ($user['username'] ?? $fallbackUsername));
  $profilePic = $user['profile_pic_url_hd'] ?? $user['profile_pic_url'] ?? null;
  if (!is_string($profilePic) || $profilePic === '') {
    return null;
  }

  $fullName = trim((string) ($user['full_name'] ?? ''));
  $biography = trim((string) ($user['biography'] ?? ''));

  return [
    'username' => $username,
    'fullName' => $fullName !== '' ? $fullName : $username,
    'biography' => $biography !== '' ? $biography : null,
    'profilePicUrl' => $profilePic,
    'profileUrl' => 'https://www.instagram.com/' . rawurlencode($username) . '/',
  ];
}

function instagram_fetch_profile_via_html(string $username, ?string $html = null): ?array
{
  if ($html === null) {
    $url = 'https://www.instagram.com/' . rawurlencode($username) . '/';
    $response = instagram_http_get($url, [
      'Accept: text/html,application/xhtml+xml',
      'Sec-Fetch-Dest: document',
      'Sec-Fetch-Mode: navigate',
      'Sec-Fetch-Site: none',
    ]);

    if (!$response['ok']) {
      return null;
    }

    $html = $response['body'];
  }

  $meta = instagram_parse_og_meta($html);
  if ($meta['image'] === null) {
    return null;
  }

  $fullName = instagram_parse_full_name($meta['title'], $username);
  $biography = instagram_parse_biography($meta['description']);

  return [
    'username' => $username,
    'fullName' => $fullName,
    'biography' => $biography,
    'profilePicUrl' => html_entity_decode($meta['image'], ENT_QUOTES | ENT_HTML5),
    'profileUrl' => 'https://www.instagram.com/' . rawurlencode($username) . '/',
  ];
}

function fetch_instagram_profile(string $handleInput): array
{
  $username = normalize_instagram_handle($handleInput);
  $lastDetail = null;

  $response = instagram_http_get(
    'https://www.instagram.com/api/v1/users/web_profile_info/?username=' . rawurlencode($username),
    [
      'Accept: */*',
      'X-IG-App-ID: ' . INSTAGRAM_WEB_APP_ID,
      'X-Requested-With: XMLHttpRequest',
      'Referer: https://www.instagram.com/' . rawurlencode($username) . '/',
    ],
  );
  if (!$response['ok']) {
    $lastDetail = instagram_request_failure_detail($response);
  } else {
    $data = json_decode($response['body'], true);
    $user = is_array($data) ? ($data['data']['user'] ?? null) : null;
    if (is_array($user)) {
      $profile = instagram_profile_from_user_payload($user, $username);
      if ($profile !== null) {
        return $profile;
      }
      $lastDetail = 'resposta sem foto de perfil';
    } else {
      $lastDetail = 'resposta JSON inválida';
    }
  }

  $htmlResponse = instagram_http_get(
    'https://www.instagram.com/' . rawurlencode($username) . '/',
    [
      'Accept: text/html,application/xhtml+xml',
      'Sec-Fetch-Dest: document',
      'Sec-Fetch-Mode: navigate',
      'Sec-Fetch-Site: none',
    ],
  );
  if (!$htmlResponse['ok']) {
    $lastDetail = instagram_request_failure_detail($htmlResponse);
  } else {
    $profile = instagram_fetch_profile_via_html($username, $htmlResponse['body']);
    if ($profile !== null) {
      return $profile;
    }
    $lastDetail = 'HTML sem metadados do perfil';
  }

  $message = 'Não foi possível acessar o perfil do Instagram';
  if ($lastDetail !== null && $lastDetail !== '') {
    $message .= ' (' . $lastDetail . ')';
  }

  throw new RuntimeException($message);
}

function instagram_parse_og_meta(string $html): array
{
  $title = null;
  $description = null;
  $image = null;

  if (preg_match('/property="og:title"\s+content="([^"]+)"/', $html, $m)) {
    $title = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
  }
  if (preg_match('/property="og:description"\s+content="([^"]+)"/', $html, $m)) {
    $description = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5);
  }
  if (preg_match('/property="og:image"\s+content="([^"]+)"/', $html, $m)) {
    $image = $m[1];
  }

  return ['title' => $title, 'description' => $description, 'image' => $image];
}

function instagram_parse_full_name(?string $title, string $username): string
{
  if ($title !== null && preg_match('/^(.+?)\s+\(@' . preg_quote($username, '/') . '\)/i', $title, $m)) {
    return trim($m[1]);
  }

  return $username;
}

function instagram_parse_biography(?string $description): ?string
{
  if ($description === null) {
    return null;
  }

  if (preg_match('/^\d[\d,.]*\s+(Followers|seguidores)/i', $description)) {
    return null;
  }

  return html_entity_decode($description, ENT_QUOTES | ENT_HTML5);
}

function download_instagram_avatar(string $imageUrl, string $assetsDir, string $username): string
{
  if (!is_dir($assetsDir) && !mkdir($assetsDir, 0755, true) && !is_dir($assetsDir)) {
    throw new RuntimeException('Não foi possível criar a pasta de assets');
  }

  $safe = preg_replace('/[^a-z0-9]+/', '-', strtolower($username)) ?? 'perfil';
  $safe = trim($safe, '-') ?: 'perfil';
  $filename = 'instagram-' . $safe . '.jpg';
  $dest = $assetsDir . DIRECTORY_SEPARATOR . $filename;

  $response = instagram_http_get($imageUrl, [
    'Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Referer: https://www.instagram.com/',
  ]);

  if (!$response['ok'] || strlen($response['body']) < 128) {
    $detail = instagram_request_failure_detail($response);
    throw new RuntimeException('Não foi possível baixar a foto do perfil (' . $detail . ')');
  }

  if (file_put_contents($dest, $response['body']) === false) {
    throw new RuntimeException('Não foi possível salvar a foto do perfil');
  }

  return 'assets/' . $filename;
}

function apply_instagram_to_client(string $clientDir, array $profile, string $clientName): void
{
  $bioPath = $clientDir . DIRECTORY_SEPARATOR . 'bio.json';
  if (!file_exists($bioPath)) {
    throw new RuntimeException('bio.json não encontrado');
  }

  $data = json_decode(file_get_contents($bioPath), true);
  if (!is_array($data)) {
    throw new RuntimeException('bio.json inválido');
  }

  $username = $profile['username'];
  $data['brand']['name'] = $clientName !== '' ? $clientName : ($profile['fullName'] ?? $username);
  $data['brand']['instagram'] = [
    'handle' => '@' . $username,
    'url' => $profile['profileUrl'] ?? ('https://www.instagram.com/' . $username . '/'),
  ];

  if (!empty($profile['biography'])) {
    $data['brand']['tagline'] = $profile['biography'];
  }

  if (isset($data['brand']['seo'])) {
    $name = $data['brand']['name'];
    $tagline = trim($data['brand']['tagline'] ?? '');
    $data['brand']['seo']['title'] = $name;
    $data['brand']['seo']['description'] = $tagline !== '' ? $name . '. ' . $tagline : $name;
  }

  if (!empty($profile['profilePicUrl'])) {
    $assetsDir = $clientDir . DIRECTORY_SEPARATOR . 'assets';
    $data['brand']['logo'] = download_instagram_avatar($profile['profilePicUrl'], $assetsDir, $username);
  }

  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  if ($json === false || file_put_contents($bioPath, $json . "\n") === false) {
    throw new RuntimeException('Não foi possível atualizar bio.json');
  }
}
