import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1768761519710 implements MigrationInterface {
    name = 'Test1768761519710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expenses\` ADD \`date\` datetime NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`expenses\` DROP COLUMN \`date\``);
    }

}
