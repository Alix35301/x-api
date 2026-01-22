import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
    constructor(private dataSource: DataSource){}

    async truncateAllTables(): Promise<void>{
        const entities =  this.dataSource.entityMetadatas;

        for(const entity of entities){
            const repo = this.dataSource.getRepository(entity.name);
            repo.query(`TRUNCATE TABLE ${entity.tableName};`)
        }
    }
}
