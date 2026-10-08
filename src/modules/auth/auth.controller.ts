import { Body, Controller, ForbiddenException, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentAdmin, Public } from '../../common/decorators';
import { Admin } from './admin.entity';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.assertOrigin(req);
    const result = await this.auth.login(dto);
    this.setCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, admin: result.admin };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.assertOrigin(req);
    const result = await this.auth.refresh(this.cookie(req));
    this.setCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, admin: result.admin };
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(this.cookie(req));
    res.clearCookie('platform_refresh', { path: '/api/auth' });
    return { ok: true };
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  me(@CurrentAdmin() admin: Admin) {
    return this.auth.profile(admin);
  }

  private cookie(req: Request): string | undefined {
    return (req as Request & { cookies?: Record<string, string> }).cookies?.platform_refresh;
  }

  private setCookie(res: Response, token: string): void {
    const days = this.config.getOrThrow<number>('jwt.refreshDays');
    res.cookie('platform_refresh', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('nodeEnv') === 'production',
      path: '/api/auth',
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }

  private assertOrigin(req: Request): void {
    const origin = req.header('origin');
    if (!origin) return;
    const allowed = this.config.getOrThrow<string[]>('corsOrigins');
    if (!allowed.includes(origin)) throw new ForbiddenException('Manba ruxsat etilmagan');
  }
}
