<?php

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

function fetch_instagram_profile(string $handleInput): array
{
  $username = normalize_instagram_handle($handleInput);
  $url = 'https://www.instagram.com/' . rawurlencode($username) . '/';

  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
      'User-Agent: Mozilla/5.0',
      'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8',
    ],
  ]);

  $html = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($html === false || $status >= 400) {
    throw new RuntimeException('Não foi possível acessar o perfil do Instagram');
  }

  $meta = instagram_parse_og_meta($html);
  if ($meta['image'] === null) {
    throw new RuntimeException('Perfil não encontrado ou indisponível');
  }

  $fullName = instagram_parse_full_name($meta['title'], $username);
  $biography = instagram_parse_biography($meta['description']);

  return [
    'username' => $username,
    'fullName' => $fullName,
    'biography' => $biography,
    'profilePicUrl' => html_entity_decode($meta['image'], ENT_QUOTES | ENT_HTML5),
    'profileUrl' => 'https://www.instagram.com/' . $username . '/',
  ];
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

  // Ignora linha padrão de estatísticas ("123 Followers, ..." ou "123 seguidores, ...")
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

  $ch = curl_init($imageUrl);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => [
      'User-Agent: Mozilla/5.0',
      'Referer: https://www.instagram.com/',
    ],
  ]);
  $bytes = curl_exec($ch);
  $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($bytes === false || $status >= 400 || strlen($bytes) < 128) {
    throw new RuntimeException('Não foi possível baixar a foto do perfil');
  }

  if (file_put_contents($dest, $bytes) === false) {
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
    $data['brand']['seo']['title'] = $data['brand']['name'] . ' · Link na Bio';
    $desc = !empty($profile['biography'])
      ? $profile['biography']
      : 'Página de links de ' . $data['brand']['name'] . '.';
    $data['brand']['seo']['description'] = $desc;
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
