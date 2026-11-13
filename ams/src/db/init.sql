-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: dams_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `asset_categories`
--

DROP TABLE IF EXISTS `asset_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_categories_name_unique` (`name`),
  UNIQUE KEY `asset_categories_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_categories`
--

LOCK TABLES `asset_categories` WRITE;
/*!40000 ALTER TABLE `asset_categories` DISABLE KEYS */;
INSERT INTO `asset_categories` VALUES (1,'IT Equipment','IT'),(2,'Furniture','FUR'),(3,'Vehicles','VEH'),(4,'Electrical Equipment','ELE'),(5,'Security Equipment','SEC'),(6,'Office Equipment','OFF'),(7,'Stationary','STN');
/*!40000 ALTER TABLE `asset_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_history`
--

DROP TABLE IF EXISTS `asset_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(50) NOT NULL,
  `action_type` enum('Created','Updated','StationChange','DepartmentChange','EmployeeReassignment','StatusChange','Obsolete','MaintenanceLogged') NOT NULL,
  `description` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_history_asset_id_assets_asset_id_fk` (`asset_id`),
  KEY `asset_history_user_id_users_id_fk` (`user_id`),
  CONSTRAINT `asset_history_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  CONSTRAINT `asset_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_history`
--

LOCK TABLES `asset_history` WRITE;
/*!40000 ALTER TABLE `asset_history` DISABLE KEYS */;
INSERT INTO `asset_history` VALUES (1,'DVLA-IT-000001','Created','Asset registered in system','2026-10-27 11:42:07',4),(2,'DVLA-IT-000002','Created','Asset registered in system','2026-10-27 11:42:07',4),(3,'DVLA-FUR-000001','Created','Asset registered in system','2026-10-27 11:42:07',4),(4,'DVLA-VEH-000001','Created','Asset registered in system','2026-10-27 11:42:07',4),(5,'DVLA-ELE-000001','Created','Asset registered in system','2026-10-27 11:42:07',4),(6,'DVLA-SEC-000001','Created','Asset registered in system','2026-10-27 11:42:07',4),(7,'DVLA-IT-000003','Created','Asset registered in system','2026-10-27 11:42:07',4),(8,'DVLA-IT-000004','Created','Asset registered in system','2026-10-27 11:42:07',4);
/*!40000 ALTER TABLE `asset_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_subcategories`
--

DROP TABLE IF EXISTS `asset_subcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_subcategories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_subcategories_code_unique` (`code`),
  KEY `asset_subcategories_category_id_asset_categories_id_fk` (`category_id`),
  CONSTRAINT `asset_subcategories_category_id_asset_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `asset_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_subcategories`
--

LOCK TABLES `asset_subcategories` WRITE;
/*!40000 ALTER TABLE `asset_subcategories` DISABLE KEYS */;
INSERT INTO `asset_subcategories` VALUES (1,1,'Laptop','LAP'),(2,1,'Desktop','DES'),(3,1,'Printer','PRI'),(4,1,'Router','RTR'),(5,1,'Switch','SWT'),(6,1,'Server','SRV'),(7,2,'Chair','CHA'),(8,2,'Table','TAB'),(9,2,'Cabinet','CAB'),(10,3,'Pickup','PIC'),(11,3,'SUV','SUV'),(12,3,'Motorcycle','MOT'),(13,4,'Generator','GEN'),(14,4,'UPS','UPS'),(15,4,'Air Conditioner','AC'),(16,5,'CCTV Camera','CCT'),(17,5,'Access Control','ACS'),(18,5,'Metal Detector','MET'),(19,6,'Shredder','SHR'),(20,6,'Projector','PRJ'),(21,7,'Paper & Envelopes','PAP'),(22,7,'Toners & Ink','TON'),(23,7,'Pens & Markers','PEN'),(24,7,'Files & Folders','FIL'),(25,7,'Forms & Registers','FRM');
/*!40000 ALTER TABLE `asset_subcategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_transfers`
--

DROP TABLE IF EXISTS `asset_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(50) NOT NULL,
  `from_region_id` int NOT NULL,
  `to_region_id` int NOT NULL,
  `from_station_id` int NOT NULL,
  `to_station_id` int NOT NULL,
  `from_department_id` int NOT NULL,
  `to_department_id` int NOT NULL,
  `previous_employee_id` int DEFAULT NULL,
  `new_employee_id` int DEFAULT NULL,
  `transfer_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` text NOT NULL,
  `transferred_by_user_id` int NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `approved_by_user_id` int DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `signature_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_transfers_asset_id_assets_asset_id_fk` (`asset_id`),
  KEY `asset_transfers_from_region_id_regions_id_fk` (`from_region_id`),
  KEY `asset_transfers_to_region_id_regions_id_fk` (`to_region_id`),
  KEY `asset_transfers_from_station_id_stations_id_fk` (`from_station_id`),
  KEY `asset_transfers_to_station_id_stations_id_fk` (`to_station_id`),
  KEY `asset_transfers_from_department_id_departments_id_fk` (`from_department_id`),
  KEY `asset_transfers_to_department_id_departments_id_fk` (`to_department_id`),
  KEY `asset_transfers_previous_employee_id_employees_id_fk` (`previous_employee_id`),
  KEY `asset_transfers_new_employee_id_employees_id_fk` (`new_employee_id`),
  CONSTRAINT `asset_transfers_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`asset_id`) ON DELETE CASCADE,
  CONSTRAINT `asset_transfers_from_department_id_departments_id_fk` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `asset_transfers_from_region_id_regions_id_fk` FOREIGN KEY (`from_region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `asset_transfers_from_station_id_stations_id_fk` FOREIGN KEY (`from_station_id`) REFERENCES `stations` (`id`),
  CONSTRAINT `asset_transfers_new_employee_id_employees_id_fk` FOREIGN KEY (`new_employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `asset_transfers_previous_employee_id_employees_id_fk` FOREIGN KEY (`previous_employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `asset_transfers_to_department_id_departments_id_fk` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `asset_transfers_to_region_id_regions_id_fk` FOREIGN KEY (`to_region_id`) REFERENCES `regions` (`id`),
  CONSTRAINT `asset_transfers_to_station_id_stations_id_fk` FOREIGN KEY (`to_station_id`) REFERENCES `stations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_transfers`
--

LOCK TABLES `asset_transfers` WRITE;
/*!40000 ALTER TABLE `asset_transfers` DISABLE KEYS */;
INSERT INTO `asset_transfers` VALUES (1,'DVLA-SEC-000001',1,1,1,2,8,1,NULL,NULL,'2026-10-27 11:42:07','Transferred to Tema station for active surveillance installation',4,'Pending',NULL,NULL,NULL);
/*!40000 ALTER TABLE `asset_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_verifications`
--

DROP TABLE IF EXISTS `asset_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(50) NOT NULL,
  `verification_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_by_user_id` int NOT NULL,
  `verification_type` enum('Quarterly','Half_Yearly','Annual') NOT NULL,
  `verification_status` enum('Verified','Missing','Damaged') NOT NULL,
  `comments` text,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `verified_at_station_id` int DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_verifications`
--

LOCK TABLES `asset_verifications` WRITE;
/*!40000 ALTER TABLE `asset_verifications` DISABLE KEYS */;
INSERT INTO `asset_verifications` VALUES (1,'DVLA-IT-000001','2026-10-27 11:42:07',5,'Quarterly','Verified','Working perfectly',NULL,NULL,NULL,NULL),(2,'DVLA-IT-000004','2026-10-27 11:42:07',5,'Annual','Missing','Not found at desk location',NULL,NULL,NULL,NULL),(3,'DVLA-IT-000003','2026-10-27 11:42:07',4,'Quarterly','Damaged','Motherboard failure due to power surge',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `asset_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `asset_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int NOT NULL,
  `subcategory_id` int NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) NOT NULL,
  `license_plate` varchar(50) DEFAULT NULL,
  `engine_number` varchar(100) DEFAULT NULL,
  `purchase_value` decimal(14,2) DEFAULT NULL,
  `description` text,
  `region_id` int NOT NULL,
  `station_id` int NOT NULL,
  `department_id` int NOT NULL,
  `assigned_employee_id` int DEFAULT NULL,
  `status` enum('Active','Under_Maintenance','Damaged','Missing','Obsolete') NOT NULL DEFAULT 'Active',
  `acquisition_date` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_verification_date` datetime DEFAULT NULL,
  PRIMARY KEY (`asset_id`),
  UNIQUE KEY `assets_serial_number_unique` (`serial_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES ('DVLA-ELE-000001','150kVA Cummins Generator',4,13,'Cummins','C150D5','SN-CUMM-77332',NULL,NULL,NULL,NULL,1,1,8,NULL,'Active','2023-11-20 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-01-10 00:00:00'),('DVLA-FUR-000001','Ergonomic Mesh Chair',2,7,'Orthofit','Task-X','SN-ORTO-00192',NULL,NULL,NULL,NULL,2,6,3,3,'Active','2025-03-10 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-05-15 00:00:00'),('DVLA-IT-000001','HP ProBook 450 G8',1,1,'HP','ProBook 450 G8','5CD12345XYZ',NULL,NULL,NULL,NULL,1,1,5,2,'Active','2025-01-15 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-04-10 00:00:00'),('DVLA-IT-000002','Cisco Catalyst 2960-L',1,5,'Cisco','2960-L 24-Port','SN-CSCO-998877',NULL,NULL,NULL,NULL,1,1,5,NULL,'Active','2025-01-15 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-04-10 00:00:00'),('DVLA-IT-000003','Dell OptiPlex 7090 Desktop',1,2,'Dell','OptiPlex 7090','SN-DELL-88371',NULL,NULL,NULL,NULL,1,2,1,NULL,'Damaged','2025-02-10 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-05-22 00:00:00'),('DVLA-IT-000004','Lenovo ThinkPad X1 Carbon',1,1,'Lenovo','X1 Carbon Gen 9','SN-LEN-9922881',NULL,NULL,NULL,NULL,1,1,7,NULL,'Missing','2025-05-15 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-04-12 00:00:00'),('DVLA-SEC-000001','Hikvision IP Dome Camera',5,16,'Hikvision','DS-2CD2143G0','SN-HIK-554422',NULL,NULL,NULL,NULL,1,2,1,NULL,'Under_Maintenance','2025-07-15 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-05-20 00:00:00'),('DVLA-VEH-000001','Toyota Hilux Double Cabin',3,10,'Toyota','Hilux 2.4L D-4D','ENG-TOY-8849201',NULL,NULL,NULL,NULL,4,11,8,4,'Active','2024-06-01 00:00:00','2026-10-27 11:42:07','2026-10-27 11:42:07','2026-03-20 00:00:00');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) NOT NULL,
  `affected_record` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'Login Success',1,'2026-10-27 11:42:07','192.168.1.10','User: admin'),(2,'Registered Asset',4,'2026-10-27 11:42:07','192.168.1.12','DVLA-IT-000001'),(3,'Transferred Asset',4,'2026-10-27 11:42:07','192.168.1.12','DVLA-SEC-000001'),(4,'Verified Asset',5,'2026-10-27 11:42:07','192.168.1.15','DVLA-IT-000004 - Missing');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (3,'Administration'),(7,'Audit'),(6,'Customer Service'),(4,'Finance & Accounts'),(5,'IT & Technical Support'),(1,'Licensing'),(8,'Operations & Security'),(2,'Vehicle Inspection');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disposals`
--

DROP TABLE IF EXISTS `disposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disposals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(50) NOT NULL,
  `disposal_method` enum('Auction','Scrapped','Donated','Written_Off') NOT NULL,
  `authorised_by_user_id` int DEFAULT NULL,
  `disposal_date` datetime NOT NULL,
  `realised_value` varchar(20) DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disposals`
--

LOCK TABLES `disposals` WRITE;
/*!40000 ALTER TABLE `disposals` DISABLE KEYS */;
/*!40000 ALTER TABLE `disposals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `position` varchar(100) NOT NULL,
  `department_id` int NOT NULL,
  `station_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employees_employee_id_unique` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'EMP-GAR-001','Kwabena Mensah','Senior Licensing Officer',1,1),(2,'EMP-GAR-002','Yaw Boateng','IT Support Technician',5,1),(3,'EMP-ASH-001','Abena Osei','Administrative Officer',3,6),(4,'EMP-WES-001','Esi Ansah','Finance Officer',4,11),(5,'EMP-EAS-001','Kofi Dede','Vehicle Inspector',2,9),(6,'EMP-GAR-003','Amma Addo','Customer Relations Executive',6,2);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_schedules`
--

DROP TABLE IF EXISTS `maintenance_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(50) NOT NULL,
  `service_type` enum('Routine','Major','Emergency') NOT NULL,
  `service_date` datetime NOT NULL,
  `next_service_due_date` datetime DEFAULT NULL,
  `odometer_reading` int DEFAULT NULL,
  `service_notes` text,
  `recorded_by_user_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_schedules`
--

LOCK TABLES `maintenance_schedules` WRITE;
/*!40000 ALTER TABLE `maintenance_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `maintenance_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('NewAsset','AssetUpdated','AssetMissing','AssetTransferred','VerificationDue','VerificationOverdue') NOT NULL,
  `message` text NOT NULL,
  `asset_id` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'AssetTransferred','Hikvision Camera (DVLA-SEC-000001) transferred to Tema Station','DVLA-SEC-000001',0,'2026-10-27 11:42:07'),(2,'AssetMissing','Lenovo ThinkPad (DVLA-IT-000004) reported Missing during annual audit','DVLA-IT-000004',0,'2026-10-27 11:42:07'),(3,'VerificationOverdue','Verification overdue for Winneba Station assets',NULL,0,'2026-10-27 11:42:07');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `regions`
--

DROP TABLE IF EXISTS `regions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `regions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `regions_name_unique` (`name`),
  UNIQUE KEY `regions_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `regions`
--

LOCK TABLES `regions` WRITE;
/*!40000 ALTER TABLE `regions` DISABLE KEYS */;
INSERT INTO `regions` VALUES (1,'Greater Accra','GAR'),(2,'Ashanti','ASH'),(3,'Eastern','EAS'),(4,'Western','WES'),(5,'Northern','NOR'),(6,'Volta','VOL'),(7,'Central','CEN');
/*!40000 ALTER TABLE `regions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','Full system access'),(4,'Asset Officer','Creates, updates and verifies assets'),(5,'Auditor','Read-only access to all records');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stations`
--

DROP TABLE IF EXISTS `stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `region_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stations_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stations`
--

LOCK TABLES `stations` WRITE;
/*!40000 ALTER TABLE `stations` DISABLE KEYS */;
INSERT INTO `stations` VALUES (1,'Accra Main (37)',1),(2,'Tema',1),(3,'Weija',1),(4,'Amasaman',1),(5,'Madina',1),(6,'Kumasi Main',2),(7,'Obuasi',2),(8,'Mampong',2),(9,'Koforidua',3),(10,'Nkawkaw',3),(11,'Takoradi',4),(12,'Tarkwa',4),(13,'Tamale',5),(14,'Ho',6),(15,'Aflao',6),(16,'Cape Coast',7),(17,'Winneba',7);
/*!40000 ALTER TABLE `stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role_id` int NOT NULL,
  `region_id` int DEFAULT NULL,
  `station_id` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$12$Zn3N2KDYn7q4/d1rhPfD8OpWc5rVi8hcsNxi0uYAJwFbcfMmzmyC2','Super Admin User','admin@dvla.gov.gh',1,NULL,NULL,1,NULL,'2026-10-27 11:42:07'),(4,'officer','$2a$12$Zn3N2KDYn7q4/d1rhPfD8OpWc5rVi8hcsNxi0uYAJwFbcfMmzmyC2','Asset Officer One','officer@dvla.gov.gh',4,NULL,NULL,1,NULL,'2026-10-27 11:42:07'),(5,'auditor','$2a$12$Zn3N2KDYn7q4/d1rhPfD8OpWc5rVi8hcsNxi0uYAJwFbcfMmzmyC2','National Auditor','auditor@dvla.gov.gh',5,NULL,NULL,1,NULL,'2026-10-27 11:42:07');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27 11:44:02
