import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RefreshTokens } from '../users/entities/refresh_tokens.entity';
import { DeviceServiceService } from '../device-service/device-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshTokens]),
  ],
  controllers: [UsersController],
  providers: [UsersService, DeviceServiceService],
  exports: [UsersService],
})
export class UsersModule {}
