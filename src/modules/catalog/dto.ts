import { Transform, Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

function toNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toSpecs(value: unknown): Record<string, string[]> | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const specs: Record<string, string[]> = {};
  for (const [key, item] of Object.entries(parsed as Record<string, unknown>)) {
    if (Array.isArray(item)) {
      specs[key] = item.map((entry) => String(entry).trim()).filter(Boolean);
    } else if (typeof item === 'string' && item.trim()) {
      specs[key] = item.split(/[\n,|]/).map((entry) => entry.trim()).filter(Boolean);
    }
  }
  return specs;
}

export class CategoryBodyDto {
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MinLength(1)
  nameRu: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  nameEn?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ProductBodyDto {
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MinLength(1)
  nameRu: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  nameEn?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  brandId?: number;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  sku?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  code?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  brandName?: string;

  @Transform(({ value }) => toNumber(value))
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  oem?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  carName?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  model?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  years?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  volumes?: string;

  @Transform(({ value }) => toSpecs(value))
  @IsOptional()
  @IsObject()
  specs?: Record<string, string[]>;
}

export class BrandBodyDto {
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MinLength(1)
  name: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  nameRu?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  nameEn?: string;

  @Transform(({ value }) => toNumber(value))
  @Type(() => Number)
  @IsInt()
  categoryId: number;
}

export class NewsBodyDto {
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MinLength(1)
  title: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MinLength(1)
  date: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  fullContent?: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  video?: string;
}

export type CategoryInput = CategoryBodyDto;
export type ProductInput = ProductBodyDto;
export type BrandInput = BrandBodyDto;
export type NewsInput = NewsBodyDto;
