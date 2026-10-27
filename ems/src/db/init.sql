-- ========================================================
-- DVLA & GHANA POST EMS TRACKING SYSTEM STANDALONE DATABASE
-- Database: ems_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS `ems_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ems_db`;

-- 1. REGIONS
CREATE TABLE IF NOT EXISTS `dms_regions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `code` varchar(10) NOT NULL UNIQUE,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dms_regions` (`id`, `name`, `code`) VALUES
(1, 'Greater Accra Region', 'GAR'),
(2, 'Ashanti Region', 'ASH'),
(3, 'Western Region', 'WR'),
(4, 'Northern Region', 'NR'),
(5, 'Eastern Region', 'ER'),
(6, 'Central Region', 'CR')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. STATIONS (OFFICES)
CREATE TABLE IF NOT EXISTS `dms_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `code` varchar(20) NOT NULL UNIQUE,
  `location` varchar(150) DEFAULT NULL,
  `region_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stations_region` (`region_id`),
  KEY `idx_stations_code` (`code`),
  FOREIGN KEY (`region_id`) REFERENCES `dms_regions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dms_stations` (`id`, `name`, `code`, `location`, `region_id`) VALUES
(1, 'Accra 37 Station', 'ACC-37', '37 Military Hospital Road, Accra', 1),
(2, 'Weija Station', 'WEI-01', 'Weija Bypass, Accra', 1),
(3, 'Tema Station', 'TEM-01', 'Community 1, Tema', 1),
(4, 'Kumasi Station', 'KUM-01', 'Adum, Kumasi', 2),
(5, 'Takoradi Station', 'TAK-01', 'Harbour Area, Takoradi', 3),
(6, 'Tamale Station', 'TAM-01', 'Hospital Road, Tamale', 4),
(7, 'Sunyani Station', 'SUN-01', 'Commercial Area, Sunyani', 2),
(8, 'Koforidua Station', 'KOF-01', 'Central Business District, Koforidua', 5),
(9, 'Cape Coast Station', 'CAP-01', 'Kotokuraba Road, Cape Coast', 6)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2b. EMS DEPARTMENTS (units under a station)
CREATE TABLE IF NOT EXISTS `ems_departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ems_dept_station_name` (`station_id`, `name`),
  KEY `idx_ems_dept_station` (`station_id`),
  FOREIGN KEY (`station_id`) REFERENCES `dms_stations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 3. ROLES
CREATE TABLE IF NOT EXISTS `dms_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL UNIQUE,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dms_roles` (`id`, `name`, `description`) VALUES
(1, 'Super_Admin', 'System Administrator with unrestricted access'),
(2, 'EMS_IT_Admin', 'EMS IT Admin: creates users, assigns offices, manages backups. Cannot edit money figures.'),
(3, 'EMS_Admin_Officer', 'EMS Admin Officer: logs dispatches, uploads receipts, submits the monthly return for own office.'),
(4, 'EMS_Manager', 'EMS Manager (Regional/District/Station Head): verifies or rejects entries from own office.'),
(5, 'EMS_Director', 'EMS Director, Administration (HQ): national oversight, approves returns, exports reports, unlocks returns.'),
(6, 'EMS_Finance_Audit', 'EMS Finance / Audit: view and export only.')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. USERS (Default password: password123)
-- Hash: $2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S
CREATE TABLE IF NOT EXISTS `dms_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(100) NOT NULL UNIQUE,
  `role_id` int NOT NULL,
  `region_id` int DEFAULT NULL,
  `station_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_station` (`station_id`),
  FOREIGN KEY (`role_id`) REFERENCES `dms_roles` (`id`),
  FOREIGN KEY (`region_id`) REFERENCES `dms_regions` (`id`),
  FOREIGN KEY (`station_id`) REFERENCES `dms_stations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dms_users` (`id`, `username`, `password_hash`, `name`, `email`, `role_id`, `region_id`, `station_id`) VALUES
(1, 'admin', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Kofi Mensah (Super Admin)', 'admin@dvla.gov.gh', 1, 1, 1),
(2, 'ems_it', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Christian Mensah (IT Admin)', 'ems.it@dvla.gov.gh', 2, 1, 1),
(3, 'ems_officer', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Francis Kojo (Kumasi Admin Officer)', 'ems.officer@dvla.gov.gh', 3, 2, 4),
(4, 'ems_officer_accra', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'David Mensah (Accra 37 Admin Officer)', 'david.mensah@dvla.gov.gh', 3, 1, 1),
(5, 'ems_mgr', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Abena Mansa (Kumasi Station Manager)', 'ems.manager@dvla.gov.gh', 4, 2, 4),
(6, 'ems_mgr_accra', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Grace Ansah (Accra 37 Station Manager)', 'grace.ansah@dvla.gov.gh', 4, 1, 1),
(7, 'ems_director', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Dr. Evans Darko (Director Administration HQ)', 'ems.director@dvla.gov.gh', 5, 1, 1),
(8, 'ems_audit', '$2b$10$5Awjyho8pORQJC1MclnnZOpVuqgF8Scy2OpGGx2UsWUkH0ATDkw1S', 'Ama Serwaa (Finance & Audit Officer)', 'ems.audit@dvla.gov.gh', 6, 1, 1)
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- 5. EMS DISPATCHES
CREATE TABLE IF NOT EXISTS `ems_dispatches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reference_id` varchar(50) NOT NULL,
  `dispatch_date` datetime NOT NULL,
  `region_id` int NOT NULL,
  `station_id` int NOT NULL,
  `recipient_name` varchar(150) NOT NULL,
  `institution` varchar(200) NOT NULL,
  `destination` varchar(150) NOT NULL,
  `ems_tracking_number` varchar(50) NOT NULL,
  `purpose` enum('Letter to HQ','Letter to Police','Client Letter','Court','Procurement','Other') NOT NULL,
  `reference_no` varchar(100) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `receipt_file` varchar(255) DEFAULT NULL,
  `receipt_original_name` varchar(255) DEFAULT NULL,
  `receipt_mime` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  `rejection_reason` text,
  `created_by_user_id` int NOT NULL,
  `verified_by_user_id` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ems_dispatches_reference_id_unique` (`reference_id`),
  UNIQUE KEY `ems_dispatches_ems_tracking_number_unique` (`ems_tracking_number`),
  KEY `idx_ems_disp_station_date` (`station_id`, `dispatch_date`),
  KEY `idx_ems_disp_region` (`region_id`),
  KEY `idx_ems_disp_status` (`status`),
  KEY `idx_ems_disp_date` (`dispatch_date`),
  FOREIGN KEY (`region_id`) REFERENCES `dms_regions` (`id`),
  FOREIGN KEY (`station_id`) REFERENCES `dms_stations` (`id`),
  FOREIGN KEY (`created_by_user_id`) REFERENCES `dms_users` (`id`),
  FOREIGN KEY (`verified_by_user_id`) REFERENCES `dms_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. EMS MONTHLY RETURNS
CREATE TABLE IF NOT EXISTS `ems_monthly_returns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL,
  `region_id` int NOT NULL,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `total_letters` int NOT NULL DEFAULT 0,
  `total_cost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('Submitted','Approved','Unlocked') NOT NULL DEFAULT 'Submitted',
  `is_late` tinyint(1) NOT NULL DEFAULT 0,
  `submitted_by_user_id` int DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by_user_id` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `unlock_reason` text,
  `unlocked_by_user_id` int DEFAULT NULL,
  `unlocked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ems_return_period` (`station_id`, `year`, `month`),
  KEY `idx_ems_return_status` (`status`),
  FOREIGN KEY (`station_id`) REFERENCES `dms_stations` (`id`),
  FOREIGN KEY (`region_id`) REFERENCES `dms_regions` (`id`),
  FOREIGN KEY (`submitted_by_user_id`) REFERENCES `dms_users` (`id`),
  FOREIGN KEY (`approved_by_user_id`) REFERENCES `dms_users` (`id`),
  FOREIGN KEY (`unlocked_by_user_id`) REFERENCES `dms_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. EMS NOTIFICATIONS
CREATE TABLE IF NOT EXISTS `ems_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('NewEntryToVerify','EntryRejected','MonthlyReminder','OverdueSubmission','ReturnSubmitted','ReturnUnlocked','ReturnApproved') NOT NULL,
  `message` text NOT NULL,
  `dispatch_id` int DEFAULT NULL,
  `return_id` int DEFAULT NULL,
  `dedupeKey` varchar(120) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ems_notif_dedupe` (`user_id`, `dedupeKey`),
  KEY `idx_ems_notif_user_read` (`user_id`, `is_read`),
  FOREIGN KEY (`user_id`) REFERENCES `dms_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. AUDIT LOGS
CREATE TABLE IF NOT EXISTS `dms_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `affected_record` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SAMPLE SEED DISPATCHES
INSERT INTO `ems_dispatches` (`reference_id`, `dispatch_date`, `region_id`, `station_id`, `recipient_name`, `institution`, `destination`, `ems_tracking_number`, `purpose`, `reference_no`, `cost`, `status`, `created_by_user_id`, `verified_by_user_id`, `verified_at`)
VALUES
('DVLA/ASH/KUM/10/0001', '2026-10-15 09:30:00', 2, 4, 'Chief Director', 'Ministry of Transport', 'Accra Ministries', 'EMS-GH-98231401', 'Letter to HQ', 'MOT/HQ/CORR/026', 45.00, 'Verified', 3, 5, '2026-10-15 14:00:00'),
('DVLA/ASH/KUM/10/0002', '2026-10-18 11:15:00', 2, 4, 'Divisional Commander', 'Ghana Police MTTD', 'Kumasi Central', 'EMS-GH-98231402', 'Letter to Police', 'POL/MTTD/VER/89', 30.00, 'Verified', 3, 5, '2026-10-18 16:30:00'),
('DVLA/ASH/KUM/10/0003', '2026-10-24 14:00:00', 2, 4, 'The Registrar', 'High Court of Justice', 'Kumasi High Court', 'EMS-GH-98231403', 'Court', 'HC/CIV/2026/884', 60.00, 'Pending', 3, NULL, NULL),
('DVLA/GAR/ACC/10/0001', '2026-10-12 10:00:00', 1, 1, 'Head of Procurement', 'PPA Ghana', 'Accra Airport Res', 'EMS-GH-98231404', 'Procurement', 'PPA/TND/2026/12', 35.00, 'Verified', 4, 6, '2026-10-12 12:45:00'),
('DVLA/GAR/ACC/10/0002', '2026-10-25 15:20:00', 1, 1, 'Client Relations Dept', 'Enterprise Insurance Ltd', 'Ridge, Accra', 'EMS-GH-98231405', 'Client Letter', 'ENT/CL/992/26', 25.00, 'Pending', 4, NULL, NULL)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- SAMPLE SEED RETURNS (Previous month)
INSERT INTO `ems_monthly_returns` (`station_id`, `region_id`, `year`, `month`, `total_letters`, `total_cost`, `status`, `is_late`, `submitted_by_user_id`, `submitted_at`, `approved_by_user_id`, `approved_at`)
VALUES
(4, 2, 2026, 9, 18, 540.00, 'Approved', 0, 3, '2026-10-02 10:00:00', 7, '2026-10-04 11:30:00'),
(1, 1, 2026, 9, 22, 680.00, 'Approved', 0, 4, '2026-10-03 09:15:00', 7, '2026-10-04 11:45:00')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- SAMPLE NOTIFICATIONS
INSERT INTO `ems_notifications` (`user_id`, `type`, `message`, `dispatch_id`, `is_read`)
VALUES
(5, 'NewEntryToVerify', 'New EMS dispatch DVLA/ASH/KUM/10/0003 logged by Francis Kojo requires verification.', 3, 0),
(6, 'NewEntryToVerify', 'New EMS dispatch DVLA/GAR/ACC/10/0002 logged by David Mensah requires verification.', 5, 0)
ON DUPLICATE KEY UPDATE `message` = VALUES(`message`);
