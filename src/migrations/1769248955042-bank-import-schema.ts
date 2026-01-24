import { MigrationInterface, QueryRunner } from "typeorm";

export class BankImportSchema1769248955042 implements MigrationInterface {
    name = 'BankImportSchema1769248955042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create bank_accounts table
        await queryRunner.query(`
            CREATE TABLE \`bank_accounts\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` varchar(255) NOT NULL,
                \`bank_name\` varchar(100) NOT NULL,
                \`account_name\` varchar(100) NULL,
                \`account_number_last4\` varchar(4) NULL,
                \`account_type\` enum ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'OTHER') NOT NULL DEFAULT 'OTHER',
                \`csv_config\` json NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_bank_accounts_user_id\` (\`user_id\`)
            ) ENGINE=InnoDB
        `);

        // Create import_history table
        await queryRunner.query(`
            CREATE TABLE \`import_history\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` varchar(255) NOT NULL,
                \`account_id\` int NOT NULL,
                \`file_name\` varchar(255) NULL,
                \`file_hash\` varchar(64) NULL,
                \`total_rows\` int NOT NULL DEFAULT 0,
                \`imported_count\` int NOT NULL DEFAULT 0,
                \`duplicate_count\` int NOT NULL DEFAULT 0,
                \`error_count\` int NOT NULL DEFAULT 0,
                \`status\` enum ('SUCCESS', 'PARTIAL', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
                \`error_details\` json NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_import_history_user_id\` (\`user_id\`),
                INDEX \`IDX_import_history_account_id\` (\`account_id\`),
                INDEX \`IDX_import_history_file_hash\` (\`file_hash\`),
                CONSTRAINT \`FK_import_history_account\` FOREIGN KEY (\`account_id\`) REFERENCES \`bank_accounts\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        // Create category_rules table
        await queryRunner.query(`
            CREATE TABLE \`category_rules\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`user_id\` varchar(255) NOT NULL,
                \`pattern\` varchar(255) NOT NULL,
                \`category_id\` int NOT NULL,
                \`priority\` int NOT NULL DEFAULT 0,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`match_count\` int NOT NULL DEFAULT 0,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_category_rules_user_id\` (\`user_id\`),
                INDEX \`IDX_category_rules_priority\` (\`priority\`)
            ) ENGINE=InnoDB
        `);

        // Alter expenses table - add source column
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
            ADD \`source\` enum ('IMPORT', 'MANUAL') NOT NULL DEFAULT 'MANUAL'
        `);

        // Alter expenses table - add import_id column
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
            ADD \`import_id\` int NULL
        `);

        // Alter expenses table - add transaction_hash column
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
            ADD \`transaction_hash\` varchar(64) NULL
        `);

        // Alter expenses table - add raw_description column
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
            ADD \`raw_description\` text NULL
        `);

        // Add index on transaction_hash
        await queryRunner.query(`
            CREATE INDEX \`IDX_expenses_transaction_hash\` ON \`expenses\` (\`transaction_hash\`)
        `);

        // Add foreign key constraint for import_id
        await queryRunner.query(`
            ALTER TABLE \`expenses\`
            ADD CONSTRAINT \`FK_expenses_import\`
            FOREIGN KEY (\`import_id\`) REFERENCES \`import_history\`(\`id\`) ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE \`expenses\` DROP FOREIGN KEY \`FK_expenses_import\`
        `);

        // Drop index
        await queryRunner.query(`
            DROP INDEX \`IDX_expenses_transaction_hash\` ON \`expenses\`
        `);

        // Drop columns from expenses table
        await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`raw_description\``);
        await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`transaction_hash\``);
        await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`import_id\``);
        await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`source\``);

        // Drop tables
        await queryRunner.query(`DROP TABLE \`category_rules\``);
        await queryRunner.query(`DROP TABLE \`import_history\``);
        await queryRunner.query(`DROP TABLE \`bank_accounts\``);
    }
}
