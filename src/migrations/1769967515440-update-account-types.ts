import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAccountTypes1769967515440 implements MigrationInterface {
    name = 'UpdateAccountTypes1769967515440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update existing data first
        await queryRunner.query(`UPDATE \`bank_accounts\` SET \`account_type\` = 'OTHER' WHERE \`account_type\` = 'CHECKING'`);
        await queryRunner.query(`UPDATE \`bank_accounts\` SET \`account_type\` = 'OTHER' WHERE \`account_type\` = 'SAVINGS'`);

        // Alter the enum to new values
        await queryRunner.query(`ALTER TABLE \`bank_accounts\` MODIFY COLUMN \`account_type\` enum ('SAVING', 'CURRENT', 'CREDIT_CARD', 'OTHER') NOT NULL DEFAULT 'OTHER'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to old enum values
        await queryRunner.query(`UPDATE \`bank_accounts\` SET \`account_type\` = 'OTHER' WHERE \`account_type\` = 'SAVING'`);
        await queryRunner.query(`UPDATE \`bank_accounts\` SET \`account_type\` = 'OTHER' WHERE \`account_type\` = 'CURRENT'`);

        await queryRunner.query(`ALTER TABLE \`bank_accounts\` MODIFY COLUMN \`account_type\` enum ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'OTHER') NOT NULL DEFAULT 'OTHER'`);
    }
}
