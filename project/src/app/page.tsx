// app/page.tsx - محسّنة للأداء والتحميل السريع
import { type Product, type Category, type Service } from '@/lib/types';
import HomePageUI from './HomePageUI';
import { Navbar } from '@/components/navbar';
import { createSupabaseServerClient } from '@/lib/utils/supabase/server';

// ثوابت تحسين الأداء
const INITIAL_PRODUCTS_PER_PAGE = 8;  // تحميل 8 فقط في البداية
const INITIAL_SERVICES_PER_PAGE = 6;  // تحميل 6 فقط في البداية

// 1. جلب المنتجات مع pagination
const fetchProducts = async (
  supabase: any,
  orderOption: 'created_at' | 'likes_count',
  limit: number = INITIAL_PRODUCTS_PER_PAGE
): Promise<Product[]> => {
  try {
    // استعلام محسّن يجلب البيانات الأساسية فقط
    const query = `
      id, created_at, name, price, currency, 
      images, likes_count, product_type,
      is_active, is_approved, main_category_id, category_id,
      sellers!left (
        id, business_name, logo_url, 
        followers_count, city
      ),
      main_category:main_category_id (id, name),
      sub_category:category_id (id, name)
    `;

    let request = supabase
      .from('products')
      .select(query, { count: 'estimated' })
      .eq('is_active', true)
      .eq('is_approved', true)
      .limit(limit);

    if (orderOption === 'likes_count') {
      request = request.order('likes_count', { ascending: false });
    } else {
      request = request.order('created_at', { ascending: false });
    }

    const { data, error } = await request;
    
    if (error) {
      console.error(`Error fetching products (${orderOption}):`, error.message);
      return [];
    }
    
    return (data || []).map((item: any) => ({
      ...item,
      product_type: 'PRODUCT'
    })) as Product[];
  } catch (error: any) {
    console.error(`Exception fetching products:`, error.message);
    return [];
  }
};

// 2. جلب الخدمات مع pagination
const fetchServices = async (
  supabase: any,
  limit: number = INITIAL_SERVICES_PER_PAGE
): Promise<Service[]> => {
  try {
    const query = `
      id, created_at, name, price, currency, 
      images, likes_count,
      is_active, is_approved, category_id, main_category_id,
      service_providers!left (
        id, business_name, logo_url, 
        followers_count, city
      ),
      main_category:main_category_id (id, name),
      category:category_id (id, name)
    `;

    const { data, error } = await supabase
      .from('services')
      .select(query, { count: 'estimated' })
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching services:', error.message);
      return [];
    }
    
    return (data || []).map((item: any) => {
      const images = Array.isArray(item.images) 
        ? item.images 
        : (item.image_url ? [item.image_url] : []);

      return {
        ...item,
        images,
        product_type: 'SERVICE',
        sellers: item.service_providers,
        sub_category: item.category
      };
    }) as Service[];

  } catch (exception: any) {
    console.error('Exception fetching services:', exception.message);
    return [];
  }
};

// 3. جلب الفئات
const fetchAllCategories = async (supabase: any): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon_name, parent_id')
      .eq('is_approved', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error.message);
      return [];
    }
    
    return data as Category[];
  } catch (error: any) {
    console.error('Exception fetching categories:', error.message);
    return [];
  }
};

export default async function HomePage() {
  try {
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }
    
    // جلب البيانات بشكل متوازي وسريع
    const [
      mostInteractedProducts,
      latestProducts,
      services,
      categories
    ] = await Promise.allSettled([
      fetchProducts(supabase, 'likes_count', INITIAL_PRODUCTS_PER_PAGE),
      fetchProducts(supabase, 'created_at', INITIAL_PRODUCTS_PER_PAGE),
      fetchServices(supabase, INITIAL_SERVICES_PER_PAGE),
      fetchAllCategories(supabase)
    ]);

    const mostInteracted = mostInteractedProducts.status === 'fulfilled' 
      ? mostInteractedProducts.value 
      : [];
    
    const latest = latestProducts.status === 'fulfilled' 
      ? latestProducts.value 
      : [];
    
    const servicesData = services.status === 'fulfilled' 
      ? services.value 
      : [];
    
    const categoriesData = categories.status === 'fulfilled' 
      ? categories.value 
      : [];

    const initialSpecialOffers = latest.slice(0, Math.ceil(latest.length / 2));
    const initialNewArrivals = latest.slice(Math.ceil(latest.length / 2));
    
    return (
      <>
        <Navbar 
          allCategories={categoriesData}
          initialMostInteracted={mostInteracted}
          initialSpecialOffers={initialSpecialOffers}
          initialNewArrivals={initialNewArrivals}
          initialServices={servicesData}
        />
        
        <HomePageUI
          initialMostInteracted={mostInteracted}
          initialSpecialOffers={initialSpecialOffers}
          initialNewArrivals={initialNewArrivals}
          initialServices={servicesData}
          allCategories={categoriesData}
        />
      </>
    );

  } catch (error: any) {
    console.error("Critical error in HomePage:", error.message);
    
    return (
      <>
        <Navbar 
          allCategories={[]}
          initialMostInteracted={[]}
          initialSpecialOffers={[]}
          initialNewArrivals={[]}
          initialServices={[]}
        />
        
        <HomePageUI
          initialMostInteracted={[]}
          initialSpecialOffers={[]}
          initialNewArrivals={[]}
          initialServices={[]}
          allCategories={[]}
        />
      </>
    );
  }
}
