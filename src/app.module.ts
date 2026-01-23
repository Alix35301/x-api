import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { ExpenseModule } from './expense/expense.module';
import { CategoryModule } from './category/category.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { DeviceServiceService } from './device-service/device-service.service';
import { DatabaseService } from './database/database.service';
import { DashboardModule } from './dashboard/dashboard.module';
import { User } from './users/entities/user.entity';
import { RefreshTokens } from './users/entities/refresh_tokens.entity';
import { Expense } from './expense/entities/expense.entity';
import { Category } from './category/entities/category.entity';

// Conditionally import SeedModule only in non-production environments
const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const database = config.get<string>('MYSQL_DATABASE');
      if (!database) throw new Error('MYSQL_DATABASE not set');
      return {
        type: 'mysql',
        host: config.get<string>('MYSQL_HOST', 'mysql'),
        port: config.get<number>('MYSQL_PORT', 3306),
        username: config.get<string>('MYSQL_USER', 'user'),
        password: config.get<string>('MYSQL_PASSWORD', 'password'),
        database,
        entities: [User, RefreshTokens, Expense, Category],
        extra: { connectionLimit: 10 },
        connectTimeout: 60000,
      };
    },
  }),
  UsersModule,
  ExpenseModule,
  CategoryModule,
  AuthModule,
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '15') * 60 * 1000 },
  }),
  DashboardModule,
];

// Only load SeedModule in development/test environments
if (process.env.NODE_ENV !== 'production') {
  const { SeedModule } = require('./seed/seed.module');
  imports.push(SeedModule);
}

@Module({
  imports,
  controllers: [AppController],
  providers: [DeviceServiceService, DatabaseService],
})
export class AppModule { }
