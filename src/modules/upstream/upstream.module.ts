import { Module } from '@nestjs/common';
import { UpstreamClient } from './upstream.client';

@Module({
  providers: [UpstreamClient],
  exports: [UpstreamClient],
})
export class UpstreamModule {}
