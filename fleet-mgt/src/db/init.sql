-- ========================================================
-- DVLA FLEET MANAGEMENT SYSTEM DATABASE
-- Database: fleet_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS `fleet_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fleet_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(150) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'Super Admin',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `name`, `role`) VALUES
(1, 'admin', 'admin@dvla.gov.gh', '$2a$10$HLKAF3hrbE3doKPN6NULEOdjXfn6o8QMSGDc9WezRIYFsy.dne7.m', 'DVLA Fleet Administrator', 'Super Admin'),
(2, 'fleet_manager', 'fleet.manager@dvla.gov.gh', '$2a$10$HLKAF3hrbE3doKPN6NULEOdjXfn6o8QMSGDc9WezRIYFsy.dne7.m', 'Fleet Manager', 'Fleet Manager'),
(3, 'transport_officer', 'transport.officer@dvla.gov.gh', '$2a$10$HLKAF3hrbE3doKPN6NULEOdjXfn6o8QMSGDc9WezRIYFsy.dne7.m', 'Transport Officer', 'Transport Officer'),
(4, 'fleet_auditor', 'fleet.auditor@dvla.gov.gh', '$2a$10$HLKAF3hrbE3doKPN6NULEOdjXfn6o8QMSGDc9WezRIYFsy.dne7.m', 'Fleet Auditor', 'Fleet Auditor')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `name` = VALUES(`name`), `role` = VALUES(`role`);

-- 2. STATIONS
CREATE TABLE IF NOT EXISTS `stations` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `stations` (`id`, `name`, `location`, `code`) VALUES
('accra', 'Accra Central Hub', 'Greater Accra', 'ACC-01'),
('kumasi', 'Kumasi Regional Station', 'Ashanti Region', 'KMS-02'),
('tema', 'Tema Port Transit Station', 'Greater Accra', 'TMA-03'),
('takoradi', 'Takoradi Harbor Depot', 'Western Region', 'TKD-04')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. DRIVERS
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `license_number` varchar(50) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `email` varchar(100) NOT NULL,
  `license_class` varchar(20) NOT NULL,
  `station_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `drivers` (`id`, `name`, `license_number`, `phone`, `email`, `license_class`, `station_id`) VALUES
('d1', 'Emmanuel Osei', 'DL-2022091', '0244112233', 'emmanuel@dvla.gov.gh', 'Class C', 'accra'),
('d2', 'Kofi Mensah', 'DL-2020188', '0205889900', 'kofi.mensah@dvla.gov.gh', 'Class D', 'kumasi'),
('d3', 'Kwame Owusu', 'DL-2023012', '0277884433', 'kowusu@dvla.gov.gh', 'Class C', 'tema'),
('d4', 'Yaw Boateng', 'DL-2021054', '0555667788', 'yboateng@dvla.gov.gh', 'Class E', 'takoradi'),
('d5', 'Andrews Addo', 'DL-2022415', '0243123456', 'a.addo@dvla.gov.gh', 'Class B', 'accra'),
('d6', 'Amma Serwaa', 'DL-2021889', '0202998877', 'aserwaa@dvla.gov.gh', 'Class B', 'kumasi'),
('d7', 'Ebenezer Tetteh', 'DL-2023901', '0544556677', 'etetteh@dvla.gov.gh', 'Class C', 'tema')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. VEHICLES
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` varchar(50) NOT NULL,
  `plate_number` varchar(50) NOT NULL,
  `chassis_number` varchar(100) NOT NULL,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `year_of_manufacture` int NOT NULL,
  `year_of_purchase` int NOT NULL,
  `designation` varchar(100) NOT NULL,
  `status` enum('Active','In Service','Maintenance','Out of Service') NOT NULL DEFAULT 'Active',
  `road_worthy_expiry` date NOT NULL,
  `station_id` varchar(50) NOT NULL,
  `current_driver` varchar(150) NOT NULL,
  `base_mileage` int NOT NULL,
  `fuel_capacity` int NOT NULL,
  `insurance_company` varchar(150) NOT NULL,
  `insurance_policy_number` varchar(100) NOT NULL,
  `insurance_expiry_date` date NOT NULL,
  `last_service_date` date NOT NULL,
  `last_service_mileage` int NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `vehicles` (`id`, `plate_number`, `chassis_number`, `make`, `model`, `year_of_manufacture`, `year_of_purchase`, `designation`, `status`, `road_worthy_expiry`, `station_id`, `current_driver`, `base_mileage`, `fuel_capacity`, `insurance_company`, `insurance_policy_number`, `insurance_expiry_date`, `last_service_date`, `last_service_mileage`) VALUES
('1', 'GP-201-22', 'AHTX12E99002130', 'Toyota', 'Hilux Double Cabin', 2021, 2022, 'Operational / Patrol Unit', 'Active', '2026-09-15', 'accra', 'Emmanuel Osei', 42000, 80, 'Enterprise Insurance Co. Ltd', 'POL-ENT-9021-2025', '2026-10-15', '2026-05-12', 43500),
('2', 'GV-405-20', 'JN8AZ01D0092305', 'Nissan', 'Patrol SUV', 2019, 2020, 'Executive Transport', 'In Service', '2026-05-10', 'kumasi', 'Kofi Mensah', 78000, 95, 'SIC Insurance PLC', 'POL-SIC-8812-2025', '2026-06-01', '2026-02-15', 75000),
('3', 'GP-880-23', '1FTFW1E80552019', 'Ford', 'Ranger Wildtrak', 2022, 2023, 'Utility / Field Operations', 'Maintenance', '2026-06-30', 'tema', 'Kwame Owusu', 25000, 80, 'Star Assurance Co. Ltd', 'POL-STA-5541-2025', '2026-07-10', '2026-06-02', 26150),
('4', 'GV-112-21', 'JTDKB20U0018873', 'Toyota', 'HiAce Ambulance', 2020, 2021, 'Ambulance / Emergency Unit', 'Active', '2026-11-20', 'takoradi', 'Yaw Boateng', 105000, 70, 'Vanguard Assurance Co. Ltd', 'POL-VNG-1129-2025', '2026-11-15', '2026-03-20', 104000),
('5', 'GP-701-19', 'MMBJRKB40034291', 'Mitsubishi', 'L200 Pick-Up', 2018, 2019, 'Pool Vehicle', 'Out of Service', '2026-03-01', 'accra', 'Unassigned (In Shop)', 142000, 75, 'Glico General Insurance Ltd', 'POL-GLI-3302-2025', '2026-04-10', '2025-11-05', 140200)
ON DUPLICATE KEY UPDATE `plate_number` = VALUES(`plate_number`);

-- 5. MAINTENANCE LOGS
CREATE TABLE IF NOT EXISTS `maintenance_logs` (
  `id` varchar(50) NOT NULL,
  `vehicle_id` varchar(50) NOT NULL,
  `service_date` date NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `notes` text,
  `status` enum('Pending','Completed') NOT NULL DEFAULT 'Pending',
  `parts_replaced` text,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `maintenance_logs` (`id`, `vehicle_id`, `service_date`, `service_type`, `cost`, `notes`, `status`, `parts_replaced`) VALUES
('m1', '1', '2026-05-12', 'Engine Oil Change', 450.00, 'Routine service with 5W-30 synthetic oil and OEM filter.', 'Completed', 'Engine Oil, Oil Filter'),
('m2', '1', '2026-03-10', 'Brake Pad Replacement', 650.00, 'Front brake pads worn down to 2mm.', 'Completed', 'Front Ceramic Brake Pads'),
('m3', '2', '2026-02-15', 'Engine Oil Change', 550.00, 'Routine 5000km scheduled service.', 'Completed', 'Engine Oil, Oil Filter'),
('m4', '3', '2026-06-02', 'Suspension Overhaul', 1800.00, 'Driver reported heavy clunking sound over speed bumps.', 'Pending', 'Front Struts, Stabilizer Links'),
('m5', '4', '2026-03-20', 'Scheduled Inspection & Repair', 1200.00, 'Complete inspection of ambulance medical equipment power inverter.', 'Completed', 'Power Inverter Relay, Battery Terminals')
ON DUPLICATE KEY UPDATE `cost` = VALUES(`cost`);

-- 6. FUEL LOGS
CREATE TABLE IF NOT EXISTS `fuel_logs` (
  `id` varchar(50) NOT NULL,
  `vehicle_id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `liters` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `odometer_reading` int NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `fuel_logs` (`id`, `vehicle_id`, `date`, `liters`, `cost`, `odometer_reading`) VALUES
('f1', '1', '2026-04-05', 70.00, 1050.00, 42350),
('f2', '1', '2026-04-22', 68.00, 1020.00, 42920),
('f3', '1', '2026-05-08', 72.00, 1080.00, 43510),
('f4', '1', '2026-05-24', 70.00, 1050.00, 44095),
('f5', '1', '2026-06-05', 75.00, 1125.00, 44715),
('f6', '2', '2026-04-10', 85.00, 1275.00, 78500),
('f7', '2', '2026-04-28', 80.00, 1200.00, 79150),
('f8', '2', '2026-05-12', 88.00, 1320.00, 79850),
('f9', '2', '2026-05-30', 82.00, 1230.00, 80480),
('f10', '2', '2026-06-09', 85.00, 1275.00, 81140)
ON DUPLICATE KEY UPDATE `cost` = VALUES(`cost`);

-- 7. ASSIGNMENT LOGS
CREATE TABLE IF NOT EXISTS `assignment_logs` (
  `id` varchar(50) NOT NULL,
  `vehicle_id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `driver_name` varchar(150) NOT NULL,
  `station_id` varchar(50) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`),
  FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `assignment_logs` (`id`, `vehicle_id`, `date`, `driver_name`, `station_id`, `notes`) VALUES
('a1', '1', '2026-05-10', 'Emmanuel Osei', 'accra', 'Initial registry allocation.'),
('a2', '2', '2026-05-12', 'Kofi Mensah', 'kumasi', 'Initial registry allocation.'),
('a3', '3', '2026-05-15', 'Kwame Owusu', 'tema', 'Initial registry allocation.'),
('a4', '4', '2026-05-18', 'Yaw Boateng', 'takoradi', 'Initial registry allocation.')
ON DUPLICATE KEY UPDATE `driver_name` = VALUES(`driver_name`);
