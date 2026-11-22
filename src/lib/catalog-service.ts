import imageCompression from "browser-image-compression";
import { getSupabaseBrowserClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "./seed-data";
import type { Category, Product } from "@/types";

const DEMO_CATEGORIES_KEY = "odiyuki-demo-categories";
const DEMO_PRODUCTS_KEY = "odiyuki-demo-products";
const STORAGE_BUCKET = "product-images";

function readDemoCategories(): Category[] {
  if (typeof window === "undefined") return SEED_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(DEMO_CATEGORIES_KEY);
    if (!raw) return SEED_CATEGORIES;
    const parsed = JSON.parse(raw) as Category[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_CATEGORIES;
  } catch {
    return SEED_CATEGORIES;
  }
}

function writeDemoCategories(categories: Category[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_CATEGORIES_KEY, JSON.stringify(categories));
}

function readDemoProducts(): Product[] {
  if (typeof window === "undefined") return SEED_PRODUCTS;
  try {
    const raw = window.localStorage.getItem(DEMO_PRODUCTS_KEY);
    if (!raw) return SEED_PRODUCTS;
    const parsed = JSON.parse(raw) as Product[];
    return Array.isArray(parsed) ? parsed : SEED_PRODUCTS;
  } catch {
    return SEED_PRODUCTS;
  }
}

function writeDemoProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products));
}

interface RawSupabaseProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  category_id: string;
  images: string[];
  is_available: boolean;
  created_at?: string;
  categories?: { name: string; prefix: string } | { name: string; prefix: string }[] | null;
}

function mapSupabaseProduct(row: RawSupabaseProduct): Product {
  const cat = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    category_id: row.category_id,
    category_name: cat?.name || "Aksesoris",
    category_prefix: cat?.prefix || "",
    images: Array.isArray(row.images) ? row.images : [],
    is_available: Boolean(row.is_available),
    created_at: row.created_at,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return readDemoCategories();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return readDemoCategories();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as Category[];
}

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    const cats = readDemoCategories();
    const catMap = new Map(cats.map((c) => [c.id, c]));
    return readDemoProducts()
      .map((p) => {
        const cat = catMap.get(p.category_id);
        return {
          ...p,
          category_name: cat?.name || p.category_name,
          category_prefix: cat?.prefix || p.category_prefix,
        };
      })
      .sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return readDemoProducts();

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, prefix)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as RawSupabaseProduct[]).map(mapSupabaseProduct);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    const all = await fetchProducts();
    return all.find((p) => p.id === id) || null;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*, categories(name, prefix)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapSupabaseProduct(data as RawSupabaseProduct);
}

export async function createCategory(
  name: string,
  prefix: string
): Promise<Category> {
  const cleanName = name.trim();
  const cleanPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!cleanName) throw new Error("Nama kategori wajib diisi.");
  if (cleanPrefix.length < 2 || cleanPrefix.length > 4) {
    throw new Error("Prefix SKU harus 2–4 huruf/angka kapital.");
  }

  const existing = await fetchCategories();
  if (
    existing.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())
  ) {
    throw new Error(`Kategori "${cleanName}" sudah ada.`);
  }
  if (existing.some((c) => c.prefix.toUpperCase() === cleanPrefix)) {
    throw new Error(`Prefix "${cleanPrefix}" sudah dipakai kategori lain.`);
  }

  if (!isSupabaseConfigured()) {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      prefix: cleanPrefix,
      created_at: new Date().toISOString(),
    };
    writeDemoCategories([...existing, newCat]);
    return newCat;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: cleanName, prefix: cleanPrefix })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const products = await fetchProducts();
  const count = products.filter((p) => p.category_id === categoryId).length;
  if (count > 0) {
    throw new Error(
      `Kategori ini masih memiliki ${count} produk aktif. Hapus atau pindahkan produk terlebih dahulu.`
    );
  }

  if (!isSupabaseConfigured()) {
    const existing = readDemoCategories();
    writeDemoCategories(existing.filter((c) => c.id !== categoryId));
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) throw new Error(error.message);
}

export function computeNextSkuPreview(
  prefix: string,
  products: Product[]
): string {
  const cleanPrefix = prefix.trim().toUpperCase();
  if (!cleanPrefix) return "---";

  let maxNum = 0;
  for (const prod of products) {
    if (prod.sku.startsWith(`${cleanPrefix}-`)) {
      const part = prod.sku.split("-")[1];
      const parsed = Number.parseInt(part || "0", 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }
  return `${cleanPrefix}-${String(maxNum + 1).padStart(3, "0")}`;
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

export async function compressAndUploadProductImages(
  files: File[]
): Promise<string[]> {
  const compressionOptions = {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1000,
    initialQuality: 0.8,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };

  const uploadedUrls: string[] = [];

  for (const file of files) {
    let compressed: File | Blob = file;
    try {
      compressed = await imageCompression(file, compressionOptions);
    } catch {
      compressed = file;
    }

    if (!isSupabaseConfigured()) {
      const dataUrl = await fileToDataUrl(compressed);
      uploadedUrls.push(dataUrl);
      continue;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase client tidak tersedia.");

    const ext = compressed.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, compressed, {
        contentType: compressed.type || "image/webp",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Gagal upload foto: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    uploadedUrls.push(publicUrlData.publicUrl);
  }

  return uploadedUrls;
}

function extractStoragePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function cleanupStorageImages(urls: string[]): Promise<void> {
  if (!isSupabaseConfigured() || urls.length === 0) return;

  const paths = urls
    .map(extractStoragePathFromUrl)
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}

export async function createProduct(input: {
  name: string;
  price: number;
  category_id: string;
  images: string[];
  is_available: boolean;
}): Promise<Product> {
  const categories = await fetchCategories();
  const category = categories.find((c) => c.id === input.category_id);
  if (!category) throw new Error("Kategori tidak valid.");

  if (!isSupabaseConfigured()) {
    const existing = readDemoProducts();
    const sku = computeNextSkuPreview(category.prefix, existing);
    const created: Product = {
      id: `prod-${Date.now()}`,
      sku,
      name: input.name.trim(),
      price: Math.round(input.price),
      category_id: input.category_id,
      category_name: category.name,
      category_prefix: category.prefix,
      images: input.images,
      is_available: input.is_available,
      created_at: new Date().toISOString(),
    };
    writeDemoProducts([created, ...existing]);
    return created;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");

  // Kosongkan sku agar trigger Postgres trg_auto_sku mengisi otomatis
  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: "",
      name: input.name.trim(),
      price: Math.round(input.price),
      category_id: input.category_id,
      images: input.images,
      is_available: input.is_available,
    })
    .select("*, categories(name, prefix)")
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseProduct(data as RawSupabaseProduct);
}

export async function updateProduct(
  id: string,
  input: {
    name: string;
    price: number;
    category_id: string;
    images: string[];
    is_available: boolean;
  },
  removedImageUrls: string[] = []
): Promise<Product> {
  const categories = await fetchCategories();
  const category = categories.find((c) => c.id === input.category_id);
  if (!category) throw new Error("Kategori tidak valid.");

  if (!isSupabaseConfigured()) {
    const existing = readDemoProducts();
    let updatedItem: Product | null = null;
    const nextList = existing.map((p) => {
      if (p.id !== id) return p;
      updatedItem = {
        ...p,
        name: input.name.trim(),
        price: Math.round(input.price),
        category_id: input.category_id,
        category_name: category.name,
        category_prefix: category.prefix,
        images: input.images,
        is_available: input.is_available,
      };
      return updatedItem;
    });
    if (!updatedItem) throw new Error("Produk tidak ditemukan.");
    writeDemoProducts(nextList);
    return updatedItem;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");

  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      price: Math.round(input.price),
      category_id: input.category_id,
      images: input.images,
      is_available: input.is_available,
    })
    .eq("id", id)
    .select("*, categories(name, prefix)")
    .single();

  if (error) throw new Error(error.message);

  if (removedImageUrls.length > 0) {
    await cleanupStorageImages(removedImageUrls);
  }

  return mapSupabaseProduct(data as RawSupabaseProduct);
}

export async function toggleProductAvailability(
  id: string,
  is_available: boolean
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const existing = readDemoProducts();
    writeDemoProducts(
      existing.map((p) => (p.id === id ? { ...p, is_available } : p))
    );
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");

  const { error } = await supabase
    .from("products")
    .update({ is_available })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteProduct(product: Product): Promise<void> {
  if (!isSupabaseConfigured()) {
    const existing = readDemoProducts();
    writeDemoProducts(existing.filter((p) => p.id !== product.id));
    return;
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id);

  if (error) throw new Error(error.message);

  if (product.images.length > 0) {
    await cleanupStorageImages(product.images);
  }
}
