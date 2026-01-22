import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { User } from '../../src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as Request & { user: Partial<User> };
    try {
      const payload = await this.jwtService.verifyAsync(request.cookies['session_token']);
      if (payload) {
        request.user = payload;
        return true;
      }
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid Token');
    }
  }
}
