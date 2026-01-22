import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from './entities/category.entity';
import { AuthModule } from '../../src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';


@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    AuthModule,
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
