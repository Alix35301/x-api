import { Body, Controller, Post, Get, Req, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDto } from './dto/user.dto';
import { AuthGuard } from './auth.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() userDto: UserDto, @Req() request: Request) {
    return this.authService.login(userDto, request);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('token') token: string) {
    return this.authService.refresh(token);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: Request) {
    return this.authService.me(request);
  }
}
