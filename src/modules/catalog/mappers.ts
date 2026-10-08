import { absoluteUrl, numberValue, stringList, textValue } from '../../common/http';
import { BrandView, CategoryView, NewsView, ProductView } from './views';

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nestedText(source: unknown, key: string): string {
  return textValue(recordOf(source)[key]);
}

function imagesFrom(base: string, record: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const images = stringList(record[key])
      .map((item) => absoluteUrl(base, item))
      .filter((item): item is string => Boolean(item));
    if (images.length) return images;
  }
  const single = absoluteUrl(base, record.imageUrl ?? record.img);
  return single ? [single] : [];
}

function specsFrom(record: Record<string, unknown>, keys: string[]): Record<string, string[]> {
  const specs: Record<string, string[]> = {};
  for (const key of keys) {
    const values = stringList(record[key]);
    if (values.length) specs[key] = values;
  }
  return specs;
}

function categoryBase(id: number, nameRu: string, nameEn: string): CategoryView {
  return { id, nameRu, nameEn, descriptionRu: '', descriptionEn: '', image: null, sortOrder: 0 };
}

export function mapCategory(kind: string, base: string, raw: unknown): CategoryView {
  const record = recordOf(raw);
  const id = numberValue(record.id) ?? 0;
  if (kind === 'trt') {
    const translations = recordOf(record.translations);
    const view = categoryBase(id, nestedText(translations.ru, 'name'), nestedText(translations.en, 'name'));
    view.descriptionRu = nestedText(translations.ru, 'description');
    view.descriptionEn = nestedText(translations.en, 'description');
    view.image = imagesFrom(base, record, ['images'])[0] ?? null;
    return view;
  }
  if (kind === 'gpg') {
    const view = categoryBase(id, textValue(record.nameRu), textValue(record.nameEn));
    view.descriptionRu = textValue(record.descriptionRu);
    view.descriptionEn = textValue(record.descriptionEn);
    view.image = imagesFrom(base, record, ['images'])[0] ?? null;
    return view;
  }
  if (kind === 'winner') {
    const title = recordOf(record.title);
    const view = categoryBase(id, textValue(title.ru), textValue(title.en));
    view.image = imagesFrom(base, record, ['images'])[0] ?? null;
    view.sortOrder = numberValue(record.sortOrder) ?? 0;
    return view;
  }
  const title = recordOf(record.title);
  const view = categoryBase(id, textValue(title.ru) || textValue(record.title_ru), textValue(title.en) || textValue(record.title_en));
  view.image = imagesFrom(base, record, ['image'])[0] ?? absoluteUrl(base, record.img);
  view.sortOrder = numberValue(record.updateOrder) ?? 0;
  return view;
}

const GPG_SPECS = ['sae', 'density', 'kinematic_one', 'kinematic_two', 'viscosityIndex', 'flash', 'temperature', 'base', 'specification'];
const VALESCO_SPECS = ['sae', 'density', 'kinematic_one', 'kinematic_two', 'viscosity', 'flash', 'temperature', 'base', 'specifications', 'info'];
const WINNER_SPECS = ['viscosityClass', 'densityAt15C', 'kinematicViscosityAt40C', 'kinematicViscosityAt100C', 'viscosityIndex', 'flashPoint', 'pourPoint', 'baseNumber', 'specifications'];

export function mapProduct(kind: string, base: string, raw: unknown): ProductView {
  const record = recordOf(raw);
  const id = numberValue(record.id) ?? 0;
  const blank: ProductView = {
    id,
    nameRu: '',
    nameEn: '',
    descriptionRu: '',
    descriptionEn: '',
    images: [],
    categoryId: null,
    brandId: null,
    sku: '',
    code: '',
    brandName: '',
    sortOrder: 0,
    oem: '',
    carName: '',
    model: '',
    years: '',
    volumes: '',
    specs: {},
  };

  if (kind === 'trt') {
    const translations = recordOf(record.translations);
    const categories = Array.isArray(record.categories) ? record.categories : [];
    return {
      ...blank,
      nameRu: nestedText(translations.ru, 'name'),
      nameEn: nestedText(translations.en, 'name'),
      images: imagesFrom(base, record, ['images']),
      categoryId: numberValue(recordOf(categories[0]).id),
      sku: textValue(record.sku),
      code: textValue(record.trtCode),
      brandName: textValue(record.brand),
      oem: stringList(record.oem).join('\n'),
      carName: stringList(record.carName).join('\n'),
      model: stringList(record.model).join('\n'),
      years: stringList(record.years).join('\n'),
    };
  }

  if (kind === 'gpg') {
    const brand = recordOf(record.brand);
    return {
      ...blank,
      nameRu: textValue(record.nameRu),
      nameEn: textValue(record.nameEn),
      descriptionRu: textValue(record.descriptionRu),
      descriptionEn: textValue(record.descriptionEn),
      images: imagesFrom(base, record, ['images']),
      brandId: numberValue(record.brandId) ?? numberValue(brand.id),
      specs: specsFrom(record, GPG_SPECS),
    };
  }

  if (kind === 'winner') {
    const name = recordOf(record.name);
    const description = recordOf(record.description);
    return {
      ...blank,
      nameRu: textValue(name.ru),
      nameEn: textValue(name.en),
      descriptionRu: textValue(description.ru),
      descriptionEn: textValue(description.en),
      images: imagesFrom(base, record, ['images']),
      categoryId: numberValue(record.categoryId) ?? numberValue(recordOf(record.category).id),
      sortOrder: numberValue(record.sortOrder) ?? 0,
      volumes: stringList(record.volumes).join('\n'),
      specs: specsFrom(record, WINNER_SPECS),
    };
  }

  return {
    ...blank,
    nameRu: textValue(record.title),
    descriptionRu: textValue(record.description_ru),
    descriptionEn: textValue(record.description_en),
    images: imagesFrom(base, record, ['image']),
    categoryId: numberValue(recordOf(record.category).id),
    sortOrder: numberValue(record.sortOrder) ?? numberValue(record.updateOrder) ?? 0,
    specs: specsFrom(record, VALESCO_SPECS),
  };
}

export function mapBrand(base: string, raw: unknown): BrandView {
  const record = recordOf(raw);
  return {
    id: numberValue(record.id) ?? 0,
    name: textValue(record.name),
    nameRu: textValue(record.nameRu),
    nameEn: textValue(record.nameEn),
    categoryId: numberValue(record.categoryId) ?? numberValue(recordOf(record.category).id),
    image: imagesFrom(base, record, ['images'])[0] ?? null,
  };
}

export function mapNews(base: string, raw: unknown): NewsView {
  const record = recordOf(raw);
  return {
    id: numberValue(record.id) ?? 0,
    title: textValue(record.title),
    description: textValue(record.description),
    date: textValue(record.date),
    fullContent: textValue(record.fullContent),
    video: textValue(record.video),
    image: imagesFrom(base, record, ['image'])[0] ?? absoluteUrl(base, record.img),
  };
}
