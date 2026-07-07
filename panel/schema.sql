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
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_email (email)
);

-- Se a tabela já existir sem a coluna, rode:
-- ALTER TABLE clients ADD COLUMN password_enc VARCHAR(255) NULL AFTER password_hash;
-- ALTER TABLE clients ADD COLUMN license_token CHAR(48) NULL UNIQUE AFTER status;

-- Insira o primeiro admin depois de gerar o hash:
-- npm run hash-password --prefix panel -- "SuaSenhaForte"
-- INSERT INTO platform_admins (email, password_hash) VALUES ('voce@email.com', '$2b$...');
