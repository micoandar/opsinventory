-- ============================================================
-- OpsInventory — Database Schema
-- Database : opsinventory_db
-- Engine   : InnoDB
-- Charset  : utf8mb4 / utf8mb4_unicode_ci
--
-- PENTING: File ini melakukan DROP TABLE. Jalankan hanya
-- saat instalasi bersih atau reset development. Semua data
-- akan hilang.
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS incident_updates;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS application_logs;
DROP TABLE IF EXISTS health_check_logs;
DROP TABLE IF EXISTS monitored_services;
DROP TABLE IF EXISTS maintenance_records;
DROP TABLE IF EXISTS asset_assignments;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username        VARCHAR(50)     NOT NULL,
  email           VARCHAR(255)    NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  full_name       VARCHAR(100)    NOT NULL,
  role            ENUM('ADMIN','SUPPORT_ENGINEER','VIEWER') NOT NULL DEFAULT 'VIEWER',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  last_login_at   DATETIME        NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. asset_categories
-- ------------------------------------------------------------
CREATE TABLE asset_categories (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL,
  description TEXT            NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asset_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. assets
-- ------------------------------------------------------------
CREATE TABLE assets (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_code      VARCHAR(50)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  category_id     BIGINT UNSIGNED NOT NULL,
  brand           VARCHAR(100)    NULL,
  model           VARCHAR(100)    NULL,
  serial_number   VARCHAR(150)    NULL,
  location        VARCHAR(150)    NULL,
  purchase_date   DATE            NULL,
  status          ENUM('AVAILABLE','IN_USE','MAINTENANCE','RETIRED') NOT NULL DEFAULT 'AVAILABLE',
  notes           TEXT            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_assets_code (asset_code),
  UNIQUE KEY uk_assets_serial (serial_number),
  KEY idx_assets_category (category_id),
  KEY idx_assets_status (status),
  CONSTRAINT fk_assets_category FOREIGN KEY (category_id)
    REFERENCES asset_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. asset_assignments
-- ------------------------------------------------------------
CREATE TABLE asset_assignments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id     BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  assigned_by  BIGINT UNSIGNED NOT NULL,
  assigned_at  DATETIME        NOT NULL,
  returned_at  DATETIME        NULL,
  notes        TEXT            NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_asset (asset_id, returned_at),
  KEY idx_assignments_user (user_id, returned_at),
  CONSTRAINT fk_assignments_asset FOREIGN KEY (asset_id)
    REFERENCES assets (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_by FOREIGN KEY (assigned_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. maintenance_records
-- ------------------------------------------------------------
CREATE TABLE maintenance_records (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id      BIGINT UNSIGNED NOT NULL,
  performed_by  BIGINT UNSIGNED NOT NULL,
  description   TEXT            NOT NULL,
  cost          DECIMAL(12,2)   NULL,
  status        ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  started_at    DATETIME        NOT NULL,
  completed_at  DATETIME        NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_maintenance_asset (asset_id, started_at),
  KEY idx_maintenance_status (status),
  CONSTRAINT fk_maintenance_asset FOREIGN KEY (asset_id)
    REFERENCES assets (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_maintenance_user FOREIGN KEY (performed_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. monitored_services
-- ------------------------------------------------------------
CREATE TABLE monitored_services (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name                      VARCHAR(150)    NOT NULL,
  url                       VARCHAR(500)    NOT NULL,
  method                    ENUM('GET','HEAD') NOT NULL DEFAULT 'GET',
  expected_status_code      SMALLINT UNSIGNED NOT NULL DEFAULT 200,
  check_interval_seconds    INT UNSIGNED    NOT NULL DEFAULT 60,
  timeout_ms                INT UNSIGNED    NOT NULL DEFAULT 5000,
  failure_threshold         TINYINT UNSIGNED NOT NULL DEFAULT 3,
  recovery_threshold        TINYINT UNSIGNED NOT NULL DEFAULT 2,
  current_status            ENUM('UNKNOWN','UP','DEGRADED','DOWN') NOT NULL DEFAULT 'UNKNOWN',
  consecutive_failures      INT UNSIGNED    NOT NULL DEFAULT 0,
  consecutive_successes     INT UNSIGNED    NOT NULL DEFAULT 0,
  is_active                 TINYINT(1)      NOT NULL DEFAULT 1,
  last_checked_at           DATETIME        NULL,
  last_status_change_at     DATETIME        NULL,
  created_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_monitored_url (url),
  KEY idx_monitored_status_active (current_status, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. health_check_logs
-- ------------------------------------------------------------
CREATE TABLE health_check_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  service_id      BIGINT UNSIGNED NOT NULL,
  status_code     SMALLINT UNSIGNED NULL,
  response_time_ms INT UNSIGNED   NULL,
  result          ENUM('UP','DEGRADED','DOWN','ERROR') NOT NULL,
  error_message   VARCHAR(500)    NULL,
  checked_at      DATETIME        NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_health_service_time (service_id, checked_at),
  KEY idx_health_result_time (result, checked_at),
  CONSTRAINT fk_health_service FOREIGN KEY (service_id)
    REFERENCES monitored_services (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. application_logs
-- ------------------------------------------------------------
CREATE TABLE application_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id    VARCHAR(128)    NULL,
  level         ENUM('DEBUG','INFO','WARN','ERROR') NOT NULL DEFAULT 'INFO',
  message       VARCHAR(500)    NOT NULL,
  context       JSON            NULL,
  method        VARCHAR(10)     NULL,
  endpoint      VARCHAR(255)    NULL,
  status_code   SMALLINT UNSIGNED NULL,
  user_id       BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_applog_level_time (level, created_at),
  KEY idx_applog_request (request_id),
  KEY idx_applog_endpoint (endpoint, created_at),
  KEY idx_applog_user (user_id),
  CONSTRAINT fk_applog_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. incidents
-- Active-incident uniqueness per service via generated column.
-- ------------------------------------------------------------
CREATE TABLE incidents (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  incident_code     VARCHAR(50)     NOT NULL,
  title             VARCHAR(200)    NOT NULL,
  description       TEXT            NOT NULL,
  severity          ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  status            ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  service_id        BIGINT UNSIGNED NULL,
  assigned_to       BIGINT UNSIGNED NULL,
  created_by        BIGINT UNSIGNED NULL,
  root_cause        TEXT            NULL,
  resolution        TEXT            NULL,
  opened_at         DATETIME        NOT NULL,
  resolved_at       DATETIME        NULL,
  closed_at         DATETIME        NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_service_id BIGINT UNSIGNED
    GENERATED ALWAYS AS (
      CASE WHEN status IN ('OPEN','IN_PROGRESS') THEN service_id ELSE NULL END
    ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_incidents_code (incident_code),
  UNIQUE KEY uk_incidents_active_service (active_service_id),
  KEY idx_incidents_status_severity (status, severity),
  KEY idx_incidents_assigned (assigned_to),
  KEY idx_incidents_opened (opened_at),
  CONSTRAINT fk_incidents_service FOREIGN KEY (service_id)
    REFERENCES monitored_services (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_incidents_assigned FOREIGN KEY (assigned_to)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_incidents_created FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. incident_updates
-- ------------------------------------------------------------
CREATE TABLE incident_updates (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  incident_id  BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NULL,
  update_type  ENUM('NOTE','STATUS_CHANGE','ASSIGNMENT','RESOLUTION') NOT NULL DEFAULT 'NOTE',
  message      TEXT            NOT NULL,
  old_status   VARCHAR(20)     NULL,
  new_status   VARCHAR(20)     NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_incident_updates_incident (incident_id, created_at),
  KEY idx_incident_updates_user (user_id),
  CONSTRAINT fk_incupdates_incident FOREIGN KEY (incident_id)
    REFERENCES incidents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_incupdates_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. audit_logs
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NULL,
  action       VARCHAR(50)     NOT NULL,
  entity_type  VARCHAR(50)     NOT NULL,
  entity_id    BIGINT UNSIGNED NULL,
  old_values   JSON            NULL,
  new_values   JSON            NULL,
  ip_address   VARCHAR(45)     NULL,
  user_agent   VARCHAR(255)    NULL,
  request_id   VARCHAR(128)    NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity_type, entity_id, created_at),
  KEY idx_audit_user (user_id, created_at),
  KEY idx_audit_action (action, created_at),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;