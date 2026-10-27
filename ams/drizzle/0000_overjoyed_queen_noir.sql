CREATE TABLE `asset_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(10) NOT NULL,
	CONSTRAINT `asset_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `asset_categories_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `asset_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(50) NOT NULL,
	`action_type` enum('Created','Updated','StationChange','DepartmentChange','EmployeeReassignment','StatusChange','Disposed','MaintenanceLogged') NOT NULL,
	`description` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`user_id` int NOT NULL,
	CONSTRAINT `asset_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_subcategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(10) NOT NULL,
	CONSTRAINT `asset_subcategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_subcategories_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `asset_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(50) NOT NULL,
	`from_region_id` int NOT NULL,
	`to_region_id` int NOT NULL,
	`from_station_id` int NOT NULL,
	`to_station_id` int NOT NULL,
	`from_department_id` int NOT NULL,
	`to_department_id` int NOT NULL,
	`previous_employee_id` int,
	`new_employee_id` int,
	`transfer_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`reason` text NOT NULL,
	`transferred_by_user_id` int NOT NULL,
	`status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
	`approved_by_user_id` int,
	`approval_date` datetime,
	`signature_url` varchar(255),
	CONSTRAINT `asset_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `asset_verifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(50) NOT NULL,
	`verification_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`verified_by_user_id` int NOT NULL,
	`verification_type` enum('Quarterly','Half_Yearly','Annual') NOT NULL,
	`verification_status` enum('Verified','Missing','Damaged') NOT NULL,
	`comments` text,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`verified_at_station_id` int,
	`photo_url` varchar(255),
	CONSTRAINT `asset_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`asset_id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category_id` int NOT NULL,
	`subcategory_id` int NOT NULL,
	`brand` varchar(100),
	`model` varchar(100),
	`serial_number` varchar(100) NOT NULL,
	`license_plate` varchar(50),
	`engine_number` varchar(100),
	`purchase_value` varchar(20),
	`description` text,
	`region_id` int NOT NULL,
	`station_id` int NOT NULL,
	`department_id` int NOT NULL,
	`assigned_employee_id` int,
	`status` enum('Active','Under_Maintenance','Damaged','Missing','Disposed') NOT NULL DEFAULT 'Active',
	`acquisition_date` datetime NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`last_verification_date` datetime,
	CONSTRAINT `assets_asset_id` PRIMARY KEY(`asset_id`),
	CONSTRAINT `assets_serial_number_unique` UNIQUE(`serial_number`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(255) NOT NULL,
	`user_id` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ip_address` varchar(45) NOT NULL,
	`affected_record` varchar(255),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `disposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(50) NOT NULL,
	`disposal_method` enum('Auction','Scrapped','Donated','Written_Off') NOT NULL,
	`authorised_by_user_id` int,
	`disposal_date` datetime NOT NULL,
	`realised_value` varchar(20),
	`notes` text,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `disposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employee_id` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`position` varchar(100) NOT NULL,
	`department_id` int NOT NULL,
	`station_id` int NOT NULL,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employee_id_unique` UNIQUE(`employee_id`)
);
--> statement-breakpoint
CREATE TABLE `maintenance_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asset_id` varchar(50) NOT NULL,
	`service_type` enum('Routine','Major','Emergency') NOT NULL,
	`service_date` datetime NOT NULL,
	`next_service_due_date` datetime,
	`odometer_reading` int,
	`service_notes` text,
	`recorded_by_user_id` int NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('NewAsset','AssetUpdated','AssetMissing','AssetTransferred','VerificationDue','VerificationOverdue') NOT NULL,
	`message` text NOT NULL,
	`asset_id` varchar(50),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(10) NOT NULL,
	CONSTRAINT `regions_id` PRIMARY KEY(`id`),
	CONSTRAINT `regions_name_unique` UNIQUE(`name`),
	CONSTRAINT `regions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(255),
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`region_id` int NOT NULL,
	CONSTRAINT `stations_id` PRIMARY KEY(`id`),
	CONSTRAINT `stations_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(150) NOT NULL,
	`email` varchar(100) NOT NULL,
	`role_id` int NOT NULL,
	`region_id` int,
	`station_id` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `asset_history` ADD CONSTRAINT `asset_history_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_history` ADD CONSTRAINT `asset_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_subcategories` ADD CONSTRAINT `asset_subcategories_category_id_asset_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `asset_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_from_region_id_regions_id_fk` FOREIGN KEY (`from_region_id`) REFERENCES `regions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_to_region_id_regions_id_fk` FOREIGN KEY (`to_region_id`) REFERENCES `regions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_from_station_id_stations_id_fk` FOREIGN KEY (`from_station_id`) REFERENCES `stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_to_station_id_stations_id_fk` FOREIGN KEY (`to_station_id`) REFERENCES `stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_from_department_id_departments_id_fk` FOREIGN KEY (`from_department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_to_department_id_departments_id_fk` FOREIGN KEY (`to_department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_previous_employee_id_employees_id_fk` FOREIGN KEY (`previous_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_new_employee_id_employees_id_fk` FOREIGN KEY (`new_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_transferred_by_user_id_users_id_fk` FOREIGN KEY (`transferred_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_approved_by_user_id_users_id_fk` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_verifications` ADD CONSTRAINT `asset_verifications_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_verifications` ADD CONSTRAINT `asset_verifications_verified_by_user_id_users_id_fk` FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_verifications` ADD CONSTRAINT `asset_verifications_verified_at_station_id_stations_id_fk` FOREIGN KEY (`verified_at_station_id`) REFERENCES `stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_category_id_asset_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `asset_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_subcategory_id_asset_subcategories_id_fk` FOREIGN KEY (`subcategory_id`) REFERENCES `asset_subcategories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_region_id_regions_id_fk` FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_station_id_stations_id_fk` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_assigned_employee_id_employees_id_fk` FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disposals` ADD CONSTRAINT `disposals_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disposals` ADD CONSTRAINT `disposals_authorised_by_user_id_users_id_fk` FOREIGN KEY (`authorised_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_departments_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_station_id_stations_id_fk` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_schedules` ADD CONSTRAINT `maintenance_schedules_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_schedules` ADD CONSTRAINT `maintenance_schedules_recorded_by_user_id_users_id_fk` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stations` ADD CONSTRAINT `stations_region_id_regions_id_fk` FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_roles_id_fk` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_region_id_regions_id_fk` FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_station_id_stations_id_fk` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE no action ON UPDATE no action;