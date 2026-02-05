import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
    constructor(private dataSource: DataSource){}

    async truncateAllTables(): Promise<void>{
        await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
        const entities = this.dataSource.entityMetadatas;

        for(const entity of entities){
            await this.dataSource.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
        }
        await this.dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
    }
}
