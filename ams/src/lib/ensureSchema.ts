import { poolConnection } from '@/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

let schemaReadyPromise: Promise<void> | null = null;

interface ColumnTypeRow extends RowDataPacket {
  COLUMN_TYPE?: string;
  DATA_TYPE?: string;
  COLUMN_NAME?: string;
}

interface IdRow extends RowDataPacket {
  id: number;
}

async function runSchemaMigrations() {
  try {
    // 1. Migrate assets.status enum: Disposed -> Obsolete, Missing -> Obsolete, add Auctioned
    const [assetStatusCols] = await poolConnection.query<ColumnTypeRow[]>(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'status'`
    );
    const assetStatusType = assetStatusCols?.[0]?.COLUMN_TYPE || '';
    if (
      assetStatusType.includes('Disposed') ||
      assetStatusType.includes('Missing') ||
      !assetStatusType.includes('Obsolete') ||
      !assetStatusType.includes('Auctioned')
    ) {
      await poolConnection.query(
        `ALTER TABLE assets MODIFY COLUMN status ENUM('Active','Under_Maintenance','Damaged','Missing','Disposed','Obsolete','Auctioned') NOT NULL DEFAULT 'Active'`
      );
      await poolConnection.query(`UPDATE assets SET status = 'Obsolete' WHERE status IN ('Disposed', 'Missing')`);
      await poolConnection.query(
        `ALTER TABLE assets MODIFY COLUMN status ENUM('Active','Under_Maintenance','Damaged','Obsolete','Auctioned') NOT NULL DEFAULT 'Active'`
      );
    }

    // 2. Migrate asset_history.action_type enum: Disposed -> Obsolete
    const [historyCols] = await poolConnection.query<ColumnTypeRow[]>(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asset_history' AND COLUMN_NAME = 'action_type'`
    );
    const historyType = historyCols?.[0]?.COLUMN_TYPE || '';
    if (historyType.includes('Disposed') || !historyType.includes('Obsolete')) {
      await poolConnection.query(
        `ALTER TABLE asset_history MODIFY COLUMN action_type ENUM('Created','Updated','StationChange','DepartmentChange','EmployeeReassignment','StatusChange','Disposed','Obsolete','MaintenanceLogged') NOT NULL`
      );
      await poolConnection.query(`UPDATE asset_history SET action_type = 'Obsolete' WHERE action_type = 'Disposed'`);
      await poolConnection.query(
        `ALTER TABLE asset_history MODIFY COLUMN action_type ENUM('Created','Updated','StationChange','DepartmentChange','EmployeeReassignment','StatusChange','Obsolete','MaintenanceLogged') NOT NULL`
      );
    }

    // 3. Ensure 'Stationary' category & subcategories exist
    const [existingStn] = await poolConnection.query<IdRow[]>(
      `SELECT id FROM asset_categories WHERE code = 'STN' OR name = 'Stationary' LIMIT 1`
    );
    let stnId: number | null = existingStn?.[0]?.id ?? null;
    if (!stnId) {
      const [insertRes] = await poolConnection.query<ResultSetHeader>(
        `INSERT INTO asset_categories (name, code) VALUES ('Stationary', 'STN')`
      );
      stnId = insertRes.insertId;
    }
    if (stnId) {
      const stnSubcats = [
        { name: 'Paper & Envelopes', code: 'PAP' },
        { name: 'Toners & Ink', code: 'TON' },
        { name: 'Pens & Markers', code: 'PEN' },
        { name: 'Files & Folders', code: 'FIL' },
        { name: 'Forms & Registers', code: 'FRM' },
      ];
      for (const sc of stnSubcats) {
        const [exists] = await poolConnection.query<IdRow[]>(
          `SELECT id FROM asset_subcategories WHERE code = ? LIMIT 1`,
          [sc.code]
        );
        if (!exists?.length) {
          await poolConnection.query(
            `INSERT INTO asset_subcategories (category_id, name, code) VALUES (?, ?, ?)`,
            [stnId, sc.name, sc.code]
          );
        }
      }
    }

    // 4. Remove Regional Manager & Station Manager roles (migrate any users to Asset Officer)
    const [removedRoles] = await poolConnection.query<IdRow[]>(
      `SELECT id FROM roles WHERE name IN ('Regional Manager', 'Station Manager')`
    );
    if (removedRoles && removedRoles.length > 0) {
      const [officerRole] = await poolConnection.query<IdRow[]>(
        `SELECT id FROM roles WHERE name = 'Asset Officer' LIMIT 1`
      );
      const officerRoleId = officerRole?.[0]?.id;
      const removedIds = removedRoles.map((r) => r.id);

      // Remove old demo accounts if present
      await poolConnection.query(
        `DELETE FROM users WHERE username IN ('rm_accra', 'sm_tema') AND role_id IN (?)`,
        [removedIds]
      );

      if (officerRoleId) {
        await poolConnection.query(
          `UPDATE users SET role_id = ? WHERE role_id IN (?)`,
          [officerRoleId, removedIds]
        );
      }

      await poolConnection.query(`DELETE FROM roles WHERE id IN (?)`, [removedIds]);
    }

    // 5. Ensure users.is_active & users.last_login_at columns exist
    const [userCols] = await poolConnection.query<ColumnTypeRow[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('is_active', 'last_login_at')`
    );
    const existingUserCols = new Set((userCols || []).map((c) => c.COLUMN_NAME));
    if (!existingUserCols.has('is_active')) {
      await poolConnection.query(`ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER station_id`);
    }
    if (!existingUserCols.has('last_login_at')) {
      await poolConnection.query(`ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL AFTER is_active`);
    }

    // 6. Ensure performance indexes exist
    const indexDefs = [
      { table: 'assets', name: 'idx_assets_status', cols: 'status' },
      { table: 'assets', name: 'idx_assets_cat_station', cols: 'category_id, station_id' },
      { table: 'asset_transfers', name: 'idx_transfers_date', cols: 'transfer_date' },
      { table: 'audit_logs', name: 'idx_audit_timestamp', cols: 'timestamp' },
    ];
    for (const idx of indexDefs) {
      const [found] = await poolConnection.query<RowDataPacket[]>(
        `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
        [idx.table, idx.name]
      );
      if (!found?.length) {
        await poolConnection.query(`CREATE INDEX ${idx.name} ON ${idx.table} (${idx.cols})`);
      }
    }

    // 7. Convert assets.purchase_value from VARCHAR to DECIMAL(14,2) if needed
    const [pvCol] = await poolConnection.query<ColumnTypeRow[]>(
      `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'purchase_value' LIMIT 1`
    );
    if (pvCol?.[0]?.DATA_TYPE && pvCol[0].DATA_TYPE.toLowerCase() !== 'decimal') {
      await poolConnection.query(
        `UPDATE assets SET purchase_value = NULL
         WHERE purchase_value IS NOT NULL AND TRIM(purchase_value) NOT REGEXP '^[0-9]+(\\.[0-9]+)?$'`
      );
      await poolConnection.query(
        `ALTER TABLE assets MODIFY COLUMN purchase_value DECIMAL(14,2) NULL`
      );
    }

    // 8. Convert disposals.realised_value from VARCHAR to DECIMAL(14,2) if needed
    const [rvCol] = await poolConnection.query<ColumnTypeRow[]>(
      `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'disposals' AND COLUMN_NAME = 'realised_value' LIMIT 1`
    );
    if (rvCol?.[0]?.DATA_TYPE && rvCol[0].DATA_TYPE.toLowerCase() !== 'decimal') {
      await poolConnection.query(
        `UPDATE disposals SET realised_value = NULL
         WHERE realised_value IS NOT NULL AND TRIM(realised_value) NOT REGEXP '^[0-9]+(\\.[0-9]+)?$'`
      );
      await poolConnection.query(
        `ALTER TABLE disposals MODIFY COLUMN realised_value DECIMAL(14,2) NULL`
      );
    }

    // 9. Ensure assets.sub_location column exists
    const [subLocCol] = await poolConnection.query<ColumnTypeRow[]>(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'sub_location' LIMIT 1`
    );
    if (!subLocCol?.length) {
      await poolConnection.query(
        `ALTER TABLE assets ADD COLUMN sub_location VARCHAR(120) NULL AFTER department_id`
      );
    }

    // 10. Ensure asset_attachments table exists
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS asset_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        doc_type ENUM('Photo','Invoice','Warranty','Other') NOT NULL DEFAULT 'Photo',
        file_url VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NULL,
        uploaded_by_user_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attachments_asset (asset_id),
        CONSTRAINT fk_attachments_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
        CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 11. Ensure audit_campaigns & audit_campaign_items tables exist
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS audit_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        station_id INT NULL,
        category_id INT NULL,
        status ENUM('Active','Completed') NOT NULL DEFAULT 'Active',
        created_by_user_id INT NULL,
        started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        CONSTRAINT fk_campaigns_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
        CONSTRAINT fk_campaigns_category FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
        CONSTRAINT fk_campaigns_user FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS audit_campaign_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        asset_id VARCHAR(50) NOT NULL,
        status ENUM('Pending','Verified','Missing','Damaged') NOT NULL DEFAULT 'Pending',
        scanned_at DATETIME NULL,
        scanned_by_user_id INT NULL,
        notes TEXT NULL,
        UNIQUE KEY uq_campaign_asset (campaign_id, asset_id),
        CONSTRAINT fk_campaign_items_campaign FOREIGN KEY (campaign_id) REFERENCES audit_campaigns(id) ON DELETE CASCADE,
        CONSTRAINT fk_campaign_items_asset FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE,
        CONSTRAINT fk_campaign_items_user FOREIGN KEY (scanned_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  } catch (err) {
    console.error('ensureSchema warning:', err);
    // Reset so a subsequent request can retry if DB was warming up
    schemaReadyPromise = null;
  }
}

export function ensureSchema(): Promise<void> {
  if (!schemaReadyPromise) {
    schemaReadyPromise = runSchemaMigrations();
  }
  return schemaReadyPromise;
}
