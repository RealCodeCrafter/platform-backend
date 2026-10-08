import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { AdminRole } from '../../common/enums';
import { presentSite } from '../sites/present-site';
import { Site } from '../sites/site.entity';
import { UpstreamClient } from '../upstream/upstream.client';
import { Admin } from './admin.entity';
import { LoginDto } from './auth.dto';
import { RefreshToken } from './refresh-token.entity';

const LOCK_AFTER = 8;
const LOCK_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly dummyHash = bcrypt.hashSync('platform-timing-pad', 12);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly upstream: UpstreamClient,
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(Site) private readonly sites: Repository<Site>,
  ) {}

  async login(dto: LoginDto) {
    const username = dto.username.trim().toLowerCase();
    const admin = await this.admins.findOne({ where: { username }, relations: { site: true } });
    const locked = Boolean(admin?.lockedUntil && admin.lockedUntil > new Date());
    const passwordOk = admin
      ? await bcrypt.compare(dto.password, admin.passwordHash)
      : await bcrypt.compare(dto.password, this.dummyHash);

    if (!admin || !admin.isActive || locked || !passwordOk) {
      if (admin?.isActive && !locked) {
        admin.failedLogins += 1;
        if (admin.failedLogins >= LOCK_AFTER) {
          admin.lockedUntil = new Date(Date.now() + LOCK_MS);
          admin.failedLogins = 0;
        }
        await this.admins.save(admin);
      }
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri');
    }

    admin.failedLogins = 0;
    admin.lockedUntil = null;
    await this.admins.save(admin);
    return this.issue(admin);
  }

  async refresh(raw?: string) {
    if (!raw) throw new UnauthorizedException('Sessiya topilmadi');
    const tokenHash = this.hash(raw);
    const row = await this.refreshTokens.findOne({ where: { tokenHash } });
    if (!row || row.revokedAt || row.expiresAt < new Date()) {
      if (row) {
        await this.refreshTokens.update({ adminId: row.adminId, revokedAt: IsNull() }, { revokedAt: new Date() });
      }
      throw new UnauthorizedException('Sessiya tugagan');
    }

    row.revokedAt = new Date();
    await this.refreshTokens.save(row);
    const admin = await this.admins.findOne({ where: { id: row.adminId }, relations: { site: true } });
    if (!admin?.isActive) throw new UnauthorizedException('Sessiya tugagan');
    return this.issue(admin);
  }

  async logout(raw?: string): Promise<{ ok: true }> {
    if (!raw) return { ok: true };
    await this.refreshTokens.update({ tokenHash: this.hash(raw), revokedAt: IsNull() }, { revokedAt: new Date() });
    return { ok: true };
  }

  async profile(admin: Admin) {
    const sites = await this.sites.find({ where: { isActive: true }, order: { name: 'ASC' } });
    const visible = admin.role === AdminRole.SUPER_ADMIN ? sites : sites.filter((site) => site.id === admin.site?.id);
    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      site: admin.site ? this.decorate(admin.site) : null,
      sites: visible.map((site) => this.decorate(site)),
    };
  }

  private decorate(site: Site) {
    const secret = this.upstream.secret(site.slug);
    return presentSite({ ...site, baseUrl: secret.baseUrl || site.baseUrl }, this.upstream.configured(secret));
  }

  private async issue(admin: Admin) {
    const expiresIn = this.config.getOrThrow<string>('jwt.accessTtl') as JwtSignOptions['expiresIn'];
    const accessToken = await this.jwt.signAsync(
      { sub: admin.id, username: admin.username, role: admin.role },
      { secret: this.config.getOrThrow<string>('jwt.accessSecret'), expiresIn },
    );
    const refreshToken = randomBytes(48).toString('hex');
    const days = this.config.getOrThrow<number>('jwt.refreshDays');
    await this.refreshTokens.save(this.refreshTokens.create({
      adminId: admin.id,
      tokenHash: this.hash(refreshToken),
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      revokedAt: null,
    }));
    return { accessToken, refreshToken, admin: await this.profile(admin) };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
