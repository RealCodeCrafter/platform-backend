export type CategoryView = {
  id: number;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  image: string | null;
  sortOrder: number;
};

export type ProductView = {
  id: number;
  nameRu: string;
  nameEn: string;
  descriptionRu: string;
  descriptionEn: string;
  images: string[];
  categoryId: number | null;
  brandId: number | null;
  sku: string;
  code: string;
  brandName: string;
  sortOrder: number;
  oem: string;
  carName: string;
  model: string;
  years: string;
  volumes: string;
  specs: Record<string, string[]>;
};

export type BrandView = {
  id: number;
  name: string;
  nameRu: string;
  nameEn: string;
  categoryId: number | null;
  image: string | null;
};

export type NewsView = {
  id: number;
  title: string;
  description: string;
  date: string;
  fullContent: string;
  video: string;
  image: string | null;
};

export const emptyProduct = (): Omit<ProductView, 'id' | 'nameRu' | 'nameEn' | 'images' | 'specs'> => ({
  descriptionRu: '',
  descriptionEn: '',
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
});
