import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UpstreamConfig } from '../../config/configuration';
import { AdminRole } from '../../common/enums';
import { Admin } from '../auth/admin.entity';
import { Site } from '../sites/site.entity';

const DEFAULT_PASSWORDS = new Set([
  'SuperAdmin2026!',
  'TrtAdmin2026!',
  'GpgAdmin2026!',
  'ValescoAdmin2026!',
  'WinnerAdmin2026!',
  'RtgAdmin2026!',
]);

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Site) private readonly sites: Repository<Site>,
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.get<boolean>('seed.enabled')) return;
    await this.syncSites();
    await this.ensureAdmins();
  }

  private async syncSites(): Promise<void> {
    const upstreams = this.config.get<Record<string, UpstreamConfig>>('upstreams') ?? {};
    for (const site of Object.values(upstreams)) {
      const existing = await this.sites.findOne({ where: { slug: site.slug } });
      if (!existing) {
        await this.sites.save(this.sites.create({
          slug: site.slug,
          name: site.name,
          kind: site.kind,
          baseUrl: site.baseUrl,
          isActive: true,
        }));
        continue;
      }
      existing.name = site.name;
      existing.kind = site.kind;
      existing.baseUrl = site.baseUrl || existing.baseUrl;
      await this.sites.save(existing);
    }
  }

  private async ensureAdmins(): Promise<void> {
    const seed = this.config.getOrThrow<{
      superUsername: string;
      superPassword: string;
      trtUsername: string;
      trtPassword: string;
      gpgUsername: string;
      gpgPassword: string;
      valescoUsername: string;
      valescoPassword: string;
      winnerUsername: string;
      winnerPassword: string;
      rtgUsername: string;
      rtgPassword: string;
    }>('seed');
    const accounts = [
      { username: seed.superUsername, password: seed.superPassword, role: AdminRole.SUPER_ADMIN, slug: null },
      { username: seed.trtUsername, password: seed.trtPassword, role: AdminRole.SITE_ADMIN, slug: 'trt' },
      { username: seed.gpgUsername, password: seed.gpgPassword, role: AdminRole.SITE_ADMIN, slug: 'gpg' },
      { username: seed.valescoUsername, password: seed.valescoPassword, role: AdminRole.SITE_ADMIN, slug: 'valesco' },
      { username: seed.winnerUsername, password: seed.winnerPassword, role: AdminRole.SITE_ADMIN, slug: 'winner' },
      { username: seed.rtgUsername, password: seed.rtgPassword, role: AdminRole.SITE_ADMIN, slug: 'rtg' },
    ];
    const production = this.config.get<string>('nodeEnv') === 'production';

    for (const account of accounts) {
      const username = account.username.trim().toLowerCase();
      if (production && DEFAULT_PASSWORDS.has(account.password)) {
        this.logger.warn(`${username} hali sinov parolida. Railwayda almashtiring.`);
      }
      const existing = await this.admins.findOne({ where: { username } });
      if (existing) continue;
      const site = account.slug ? await this.sites.findOne({ where: { slug: account.slug } }) : null;
      await this.admins.save(this.admins.create({
        username,
        passwordHash: await bcrypt.hash(account.password, 12),
        role: account.role,
        isActive: true,
        failedLogins: 0,
        lockedUntil: null,
        site,
      }));
      this.logger.log(`Admin yaratildi: ${username}`);
    }
  }
}
