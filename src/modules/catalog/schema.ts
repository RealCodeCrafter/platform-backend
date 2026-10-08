import { SiteKind } from '../../config/configuration';

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'lines';

export type CatalogField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  optionsFrom?: 'categories' | 'brands';
  primary?: boolean;
};

const field = (
  key: string,
  label: string,
  type: FieldType = 'text',
  required = false,
  extra: Partial<CatalogField> = {},
): CatalogField => ({ key, label, type, required, ...extra });

const SPEC_OIL = [
  field('specs.sae', 'SAE', 'lines'),
  field('specs.density', 'Zichlik', 'lines'),
  field('specs.kinematic_one', 'Kinematik 40°C', 'lines'),
  field('specs.kinematic_two', 'Kinematik 100°C', 'lines'),
  field('specs.viscosity', 'Yopishqoqlik indeksi', 'lines'),
  field('specs.flash', 'Yonish harorati', 'lines'),
  field('specs.temperature', 'Qotish harorati', 'lines'),
  field('specs.base', 'Asos soni', 'lines'),
  field('specs.specifications', 'Spetsifikatsiya', 'lines'),
];

export function modulesFor(kind: SiteKind): string[] {
  if (kind === 'gpg') return ['categories', 'brands', 'products'];
  if (kind === 'valesco') return ['categories', 'products', 'news'];
  return ['categories', 'products'];
}

export function catalogSchema(kind: SiteKind) {
  return {
    kind,
    modules: modulesFor(kind),
    imageRequired: kind === 'winner',
    category: categoryFields(kind),
    product: productFields(kind),
    brand: kind === 'gpg' ? brandFields() : [],
    news: kind === 'valesco' ? newsFields() : [],
  };
}

function categoryFields(kind: SiteKind): CatalogField[] {
  const fields = [
    field('nameRu', 'Nomi (RU)', 'text', true, { primary: true }),
    field('nameEn', 'Nomi (EN)', 'text', kind !== 'gpg'),
  ];
  if (kind === 'gpg' || kind === 'trt' || kind === 'rtg') {
    fields.push(field('descriptionRu', 'Tavsif (RU)', 'textarea'), field('descriptionEn', 'Tavsif (EN)', 'textarea'));
  }
  if (kind === 'winner' || kind === 'rtg' || kind === 'trt') {
    fields.push(field('sortOrder', 'Tartib', 'number'));
  }
  return fields;
}

function productFields(kind: SiteKind): CatalogField[] {
  if (kind === 'trt') {
    return [
      field('sku', 'SKU', 'text', true),
      field('nameRu', 'Nomi (RU)', 'text', true, { primary: true }),
      field('nameEn', 'Nomi (EN)', 'text', true),
      field('code', 'TRT kod', 'text', true),
      field('brandName', 'Brend', 'text', true),
      field('categoryId', 'Kategoriya', 'select', false, { optionsFrom: 'categories' }),
      field('oem', 'OEM', 'lines'),
      field('carName', 'Avtomobil', 'lines'),
      field('model', 'Model', 'lines'),
      field('years', 'Yillar', 'lines'),
    ];
  }

  if (kind === 'gpg') {
    return [
      field('nameRu', 'Nomi (RU)', 'text', true, { primary: true }),
      field('nameEn', 'Nomi (EN)', 'text'),
      field('descriptionRu', 'Tavsif (RU)', 'textarea'),
      field('descriptionEn', 'Tavsif (EN)', 'textarea'),
      field('brandId', 'Brend', 'select', true, { optionsFrom: 'brands' }),
      field('specs.sae', 'SAE', 'lines'),
      field('specs.density', 'Zichlik', 'lines'),
      field('specs.kinematic_one', 'Kinematik 40°C', 'lines'),
      field('specs.kinematic_two', 'Kinematik 100°C', 'lines'),
      field('specs.viscosityIndex', 'Yopishqoqlik indeksi', 'lines'),
      field('specs.flash', 'Yonish harorati', 'lines'),
      field('specs.temperature', 'Harorat', 'lines'),
      field('specs.base', 'Asos', 'lines'),
      field('specs.specification', 'Spetsifikatsiya', 'lines'),
    ];
  }

  if (kind === 'winner') {
    return [
      field('nameRu', 'Nomi (RU)', 'text', true, { primary: true }),
      field('nameEn', 'Nomi (EN)', 'text', true),
      field('descriptionRu', 'Tavsif (RU)', 'textarea'),
      field('descriptionEn', 'Tavsif (EN)', 'textarea'),
      field('categoryId', 'Kategoriya', 'select', true, { optionsFrom: 'categories' }),
      field('volumes', 'Hajmlar', 'lines'),
      field('sortOrder', 'Tartib', 'number'),
      field('specs.viscosityClass', 'SAE', 'lines'),
      field('specs.densityAt15C', 'Zichlik 15°C', 'lines'),
      field('specs.kinematicViscosityAt40C', 'Kinematik 40°C', 'lines'),
      field('specs.kinematicViscosityAt100C', 'Kinematik 100°C', 'lines'),
      field('specs.viscosityIndex', 'Yopishqoqlik indeksi', 'lines'),
      field('specs.flashPoint', 'Yonish harorati', 'lines'),
      field('specs.pourPoint', 'Qotish harorati', 'lines'),
      field('specs.baseNumber', 'Asos soni', 'lines'),
      field('specs.specifications', 'Spetsifikatsiya', 'lines'),
    ];
  }

  if (kind === 'valesco') {
    return [
      field('nameRu', 'Nomi', 'text', true, { primary: true }),
      field('descriptionRu', 'Tavsif (RU)', 'textarea'),
      field('descriptionEn', 'Tavsif (EN)', 'textarea'),
      field('categoryId', 'Kategoriya', 'select', true, { optionsFrom: 'categories' }),
      field('sortOrder', 'Tartib', 'number'),
      ...SPEC_OIL,
      field('specs.info', 'Qo‘shimcha', 'lines'),
    ];
  }

  return [
    field('nameRu', 'Nomi (RU)', 'text', true, { primary: true }),
    field('nameEn', 'Nomi (EN)', 'text'),
    field('descriptionRu', 'Tavsif (RU)', 'textarea'),
    field('descriptionEn', 'Tavsif (EN)', 'textarea'),
    field('categoryId', 'Kategoriya', 'select', false, { optionsFrom: 'categories' }),
    field('sortOrder', 'Tartib', 'number'),
  ];
}

function brandFields(): CatalogField[] {
  return [
    field('name', 'Nomi', 'text', true, { primary: true }),
    field('nameRu', 'Nomi (RU)', 'text'),
    field('nameEn', 'Nomi (EN)', 'text'),
    field('categoryId', 'Kategoriya', 'select', true, { optionsFrom: 'categories' }),
  ];
}

function newsFields(): CatalogField[] {
  return [
    field('title', 'Sarlavha', 'text', true, { primary: true }),
    field('date', 'Sana', 'text', true),
    field('description', 'Qisqa matn', 'textarea'),
    field('fullContent', 'To‘liq matn', 'textarea'),
    field('video', 'Video URL', 'text'),
  ];
}

export function requiredValue(input: Record<string, unknown>, key: string): unknown {
  if (key.startsWith('specs.')) {
    const specs = input.specs;
    if (!specs || typeof specs !== 'object') return undefined;
    return (specs as Record<string, unknown>)[key.slice(6)];
  }
  return input[key];
}
