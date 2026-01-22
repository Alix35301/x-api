import { DataSource } from 'typeorm';

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;
  
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
  
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
  }
  
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
}