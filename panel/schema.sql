-- Links na Bio — schema inicial do painel (/panel/)
-- Execute no phpMyAdmin da HostGator após criar o banco.

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
  password_enc  VARCHAR(255) NULL COMMENT 'senha do editor cifrada (AES) para consulta',
  status        ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',
  license_token CHAR(48) NULL UNIQUE,
  analytics_key CHAR(36) NULL UNIQUE COMMENT 'UUID v4 para ingestão pública de analytics',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id     INT UNSIGNED NOT NULL,
  slug          VARCHAR(40) NULL COMMENT 'denormalizado no insert; não é chave de auth',
  event_type    ENUM('pageview', 'click') NOT NULL,
  occurred_at   DATETIME NOT NULL,
  visitor_id    CHAR(36) NULL,
  session_id    CHAR(36) NULL,
  path          VARCHAR(255) NULL,
  referrer      VARCHAR(512) NULL,
  section_id    VARCHAR(80) NULL,
  item_index    SMALLINT UNSIGNED NULL,
  item_type     VARCHAR(40) NULL,
  label         VARCHAR(160) NULL,
  target_url    VARCHAR(1024) NULL,
  ip_hash       CHAR(64) NULL COMMENT 'hash do IP, não IP cru',
  user_agent    VARCHAR(255) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_time (client_id, occurred_at),
  INDEX idx_type_time (event_type, occurred_at),
  INDEX idx_visitor_day (client_id, event_type, visitor_id, occurred_at),
  CONSTRAINT fk_analytics_client FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE CASCADE
);

-- Se a tabela já existir sem a coluna, rode:
-- ALTER TABLE clients ADD COLUMN password_enc VARCHAR(255) NULL AFTER password_hash;
-- ALTER TABLE clients ADD COLUMN license_token CHAR(48) NULL UNIQUE AFTER status;
-- ALTER TABLE clients ADD COLUMN analytics_key CHAR(36) NULL UNIQUE AFTER license_token;

-- Insira o primeiro admin depois de gerar o hash:
-- npm run hash-password --prefix panel -- "SuaSenhaForte"
-- INSERT INTO platform_admins (email, password_hash) VALUES ('voce@email.com', '$2b$...');
