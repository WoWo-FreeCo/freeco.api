import { ProductAttribute } from '.prisma/client';

export interface ProductImage {
  index: number;
  img: string;
}

export interface ProductMarkdownInfo {
  index: number;
  title: string;
  text: string;
}

export interface Product {
  id: number;
  skuId: string | null;
  categoryId: number | null;
  coverImg: string | null;
  name: string;
  price: number;
  memberPrice: number;
  vipPrice: number;
  svipPrice: number;
  attribute: ProductAttribute;
  images: ProductImage[];
}

export interface ProductDetail extends Product {
  markdownInfos: ProductMarkdownInfo[];
}
