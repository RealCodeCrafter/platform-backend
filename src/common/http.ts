import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    let message: string | string[] = 'Server xatosi';

    if (typeof body === 'string') {
      message = body;
    } else if (body && typeof body === 'object' && 'message' in body) {
      message = (body as { message: string | string[] }).message;
    }

    if (status >= 500 && !(exception instanceof HttpException)) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({ statusCode: status, message });
  }
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function asList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'rows', 'products', 'categories', 'brands', 'news', 'result']) {
      if (Array.isArray(record[key])) {
        return asList(record[key]);
      }
    }
  }
  return [];
}

export function textValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function numberValue(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(/[\n,|]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function absoluteUrl(base: string, value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${base.replace(/\/$/, '')}${value}`;
  return `${base.replace(/\/$/, '')}/${value}`;
}

export function buildForm(
  fields: Record<string, string | number | undefined>,
  files: Express.Multer.File[],
  fileField: string,
): FormData {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === '') continue;
    body.append(key, String(value));
  }
  for (const file of files) {
    const bytes = new Uint8Array(file.buffer);
    body.append(fileField, new Blob([bytes], { type: file.mimetype || 'application/octet-stream' }), file.originalname || 'image');
  }
  return body;
}
