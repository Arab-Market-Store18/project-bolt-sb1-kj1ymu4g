// : features/merchant/profile-merchant/actions/profile-merchant.actions.ts


import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client";

export const fetchSellerCoreData = async (sellerId: string | null) => {
  if (!sellerId) return null;
  
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const sellerQuery = supabase
    .from("sellers")
    .select("id, business_name, logo_url, store_image_url, description, store_type, city, phone_numbers, followers_count, total_likes_count, rating, trust_features, faqs, working_hours")
    .eq("id", sellerId)
    .maybeSingle();
  
  const followingQuery = user?.id
    ? supabase.from("seller_follows").select("*", { count: "exact" }).eq("seller_id", sellerId).eq("user_id", user.id)
    : Promise.resolve({ count: 0, error: null });
  
  const categoriesQuery = supabase.from("categories").select("id, name, parent_id");
  
  const [sellerResult, followingResult, categoriesResult] = await Promise.all([
    sellerQuery,
    followingQuery,
    categoriesQuery,
  ]);
  
  if (sellerResult.error) {
    console.error("Supabase error:", sellerResult.error);
    throw new Error("Error fetching seller data: " + sellerResult.error.message);
  }
  
  if (!sellerResult.data) return null;
  
  const dbData = sellerResult.data;
  const formattedData = {
    ...dbData,
    isFollowing: (followingResult.count ?? 0) > 0,
    allCategories: categoriesResult.data || [],
  };
  
  return formattedData;
};

export const fetchSellerReviews = async (sellerId: string | null) => {
  if (!sellerId) {
    console.log("[SELLER DEBUG] No seller ID provided");
    return [];
  }
  
  const supabase = createSupabaseBrowserClient();
  console.log("[SELLER DEBUG] Fetching reviews for seller ID: " + sellerId);
  
  try {
    const { data, error } = await supabase
      .from("seller_reviews")
      .select("id, created_at, rating, comment, user_id, user_name, user_avatar_url")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });
    
    console.log("[SELLER DEBUG] Fetched seller reviews data:", data);
    
    if (error) {
      console.error("[SELLER DEBUG] Error fetching seller reviews:", error);
      throw new Error(error.message);
    }
    
    const formattedData = (data || []).map(review => ({
      ...review,
      profiles: { 
        full_name: review.user_name || "User", 
        avatar_url: review.user_avatar_url || null 
      }
    }));
    
    console.log("[SELLER DEBUG] Formatted reviews:", formattedData);
    return formattedData;
  } catch (error) {
    console.error("[SELLER DEBUG] Exception in fetchSellerReviews:", error);
    return [];
  }
};

export const toggleFollowSeller = async (sellerId: string, isCurrentlyFollowing: boolean) => {
  const supabase = createSupabaseBrowserClient();
  const functionName = isCurrentlyFollowing ? "unfollow_seller" : "follow_seller";
  const params = isCurrentlyFollowing 
    ? { seller_id_to_unfollow: sellerId } 
    : { seller_id_to_follow: sellerId };
  
  const { error } = await supabase.rpc(functionName, params);
  if (error) {
    console.error("RPC Follow/Unfollow Error:", error);
    throw error;
  }
  
  return { success: true };
};

export const submitSellerReview = async (sellerId: string, reviewData: { rating: number; comment: string }) => {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("User not authenticated");
  if (user.id === sellerId) throw new Error("Seller cannot review their own store");

  const [sellerResult, profileResult] = await Promise.all([
    supabase.from("sellers").select("business_name, logo_url").eq("id", user.id).single(),
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()
  ]);

  let userName = "User";
  let userAvatar = null;

  if (sellerResult.data) {
    userName = sellerResult.data.business_name || "User";
    userAvatar = sellerResult.data.logo_url;
  } else if (profileResult.data) {
    userName = profileResult.data.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    userAvatar = profileResult.data.avatar_url || user.user_metadata?.avatar_url;
  } else {
    userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    userAvatar = user.user_metadata?.avatar_url;
  }

  const { count, error: countError } = await supabase
    .from("seller_reviews")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("user_id", user.id);
  
  if (countError) throw countError;
  if (count !== null && count > 0) throw new Error("User has already reviewed this seller");

  const { error } = await supabase
    .from("seller_reviews")
    .insert({ 
      seller_id: sellerId, 
      user_id: user.id, 
      rating: reviewData.rating, 
      comment: reviewData.comment, 
      user_name: userName, 
      user_avatar_url: userAvatar 
    });
  
  if (error) throw error;
  return { success: true };
};

export async function fetchSellerProducts(sellerId: string) {
  if (!sellerId) {
    console.log("[SELLER DEBUG] No seller ID provided for products");
    return [];
  }
  
  const supabase = createSupabaseBrowserClient();
  console.log("[SELLER DEBUG] Fetching products for seller ID:", sellerId);
  
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        discount_price,
        currency,
        images,
        is_best_seller,
        category_id,
        main_category_id,
        sellers!inner(id, business_name)
      `)
      .eq("sellers.id", sellerId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (error) {
      console.error("[SELLER DEBUG] Error fetching seller products:", error);
      throw new Error(error.message);
    }
    
    console.log("[SELLER DEBUG] Fetched products:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("[SELLER DEBUG] Exception in fetchSellerProducts:", error);
    return [];
  }
}
