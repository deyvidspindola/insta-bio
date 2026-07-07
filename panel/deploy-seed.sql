-- Execute no phpMyAdmin (banco deyvid87_links_na_bio)
-- Depois do build, suba platform-release/ para public_html/

CREATE TABLE IF NOT EXISTS platform_admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(40) NOT NULL UNIQUE,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_enc  VARCHAR(255) NULL,
  status        ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  license_token CHAR(48) NULL UNIQUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email)
);

-- Admin do painel (senha: LinksNaBio@2026 — troque após o primeiro login)
INSERT INTO platform_admins (email, password_hash)
VALUES (
  'admin@linksnabio.app.br',
  '$2b$10$ZewAUrubp6a.uBekByPQreU/kfrp/DeXTtq4SewqvxV1pI4gPpJ8.'
)
ON DUPLICATE KEY UPDATE email = email;
