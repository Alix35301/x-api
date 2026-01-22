import { MigrationInterface, QueryRunner } from "typeorm";

export class UserId1768804586565 implements MigrationInterface {
    name = 'UserId1768804586565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expenses\` ADD \`user_id\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`user_id\``);
    }

}
