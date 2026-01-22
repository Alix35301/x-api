import { DataSource } from "typeorm"
import { getDbConfig } from "./src/configs/database";

export const AppDataSource = new DataSource(getDbConfig())