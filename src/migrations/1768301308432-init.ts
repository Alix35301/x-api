import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1768301308432 implements MigrationInterface {
    name = 'Init1768301308432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`refresh_tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`token_hash\` varchar(255) NOT NULL, \`expires_at\` datetime NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`revoked_at\` datetime NULL, \`device_name\` varchar(255) NOT NULL, \`ip_address\` varchar(255) NOT NULL, \`user_agent\` varchar(255) NOT NULL, \`last_used_at\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`expenses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`amount\` int NOT NULL, \`category_id\` varchar(255) NOT NULL, \`is_approved\` tinyint NOT NULL DEFAULT 0, \`deleted_at\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NULL, \`description\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`categories\``);
        await queryRunner.query(`DROP TABLE \`expenses\``);
        await queryRunner.query(`DROP TABLE \`refresh_tokens\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
