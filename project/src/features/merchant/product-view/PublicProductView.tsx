// features/merchant/product-view/PublicProductView.tsx

"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// --- Types ---
import { ProductDetails, Category } from "./types/product.types";

// --- Actions ---
import { fetchProduct } from "./actions/fetchProduct.action";

// --- Hooks ---
import { useProductMedia } from "./hooks/useProductMedia";
import { useProductReviews } from "./hooks/useProductReviews";

// --- Layout Components ---
import { ProductHeader } from "./components/layout/ProductHeader";
import { ProductActionsBar } from "./components/layout/ProductActionsBar";
import { ProductPageSkeleton } from "./components/layout/ProductPageSkeleton";

// --- Section Components ---
import { ProductMediaGallery } from "./components/sections/ProductMediaGallery";
import { ProductDetailsSection } from "./components/sections/ProductDetailsSection";
import { ProductReviewsSection } from "./components/sections/ProductReviewsSection";
import { RelatedProductsSection } from "./components/sections/RelatedProductsSection";

// --- Shared/External Components (Assuming paths) ---
import { RelatedProducts } from '@/components/recommendations/RelatedProducts';
import { MostPopular } from '@/components/recommendations/MostPopular';
import { CrossSellPicks } from '@/components/recommendations/CrossSellPicks';
import { DallahDiscussionSection } from '@/components/dallah-discussion-section';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";


interface PublicProductViewProps {
  productId: string;
}

export function PublicProductView({ productId }: PublicProductViewProps) {
  const router = useRouter();
  const { onOpen } = useModal();
  // --- Core State Management ---
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // استخدام AuthContext بدل إدارة الجلسة بشكل منفصل
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();

  // --- Data Fetching Logic ---
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { product, similarProducts, allCategories } = await fetchProduct(productId);
      setProduct(product);
      setSimilarProducts(similarProducts);
      setAllCategories(allCategories);
    } catch (error: any) {
      toast.error("خطأ في جلب المنتج", { description: error.message });
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // تم نقل إدارة المستخدم إلى useAuth()

  // --- Derived State from Hooks ---
  const { mediaItems, discountPercentage } = useProductMedia(product);
  const reviewsWithReplies = useProductReviews(product?.reviews);

  // --- Event Handlers ---
  const handleNavigateToSeller = useCallback(() => {
    if (product?.sellers?.id) {
      onOpen('sellerProfile', { sellerId: product.sellers.id });
    }
  }, [product, onOpen]);

  // --- Render Logic ---
  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-center p-4">
        <h2 className="text-2xl font-bold">عذراً، المنتج غير موجود</h2>
        <p className="text-muted-foreground mt-2">قد يكون الرابط غير صحيح أو تم حذف المنتج.</p>
        <Button onClick={() => router.push('/')} className="mt-6">
          <ArrowLeft className="ml-2 h-4 w-4" /> العودة للرئيسية
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <ProductHeader seller={product.sellers} onNavigateToSeller={handleNavigateToSeller} />

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Column (Media and Recommendations) */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 lg:self-start space-y-8">
            <ProductMediaGallery
              product={product}
              mediaItems={mediaItems}
              discountPercentage={discountPercentage}
            />
            
            {product.sellers && (
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <Suspense fallback={null}>
                  <RelatedProducts
                    sellerId={product.sellers.id}
                    currentProductId={product.id}
                    sellerName={product.sellers.business_name}
                    sellerLogoUrl={(product.sellers as any)?.logo_url ?? null}
                  />
                </Suspense>
              </div>
            )}
            
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <Suspense fallback={null}>
                <CrossSellPicks
                  currentProductId={product.id}
                  categoryId={product.category_id}
                  mainCategoryId={product.main_category_id}
                />
              </Suspense>
            </div>
          </div>
          
          {/* Right Column (Details and Smart Recommendations) */}
          <div className="lg:col-span-2 space-y-8">
            <ProductDetailsSection product={product} />
            
            <Separator />

            <Suspense fallback={null}>
              <DallahDiscussionSection
                service={product}
                currentUser={currentUser}
                onOpenAuthModal={() => onOpen('emailSignUp')}
              />
            </Suspense>

            <Separator />

            <ProductReviewsSection
              product={product}
              reviewsWithReplies={reviewsWithReplies}
              currentUser={currentUser}
              isAuthLoading={isAuthLoading}
              onOpenAuthModal={() => onOpen('emailSignUp')}
              onDataChange={loadData}
            />

            <div className="mt-8 bg-white rounded-lg border p-4 shadow-sm">
              <Suspense fallback={null}>
                <MostPopular />
              </Suspense>
            </div>
          </div>
        </div>
        
        <RelatedProductsSection similarProducts={similarProducts} allCategories={allCategories} />
      </div>
      
      <ProductActionsBar product={product} />
    </div>
  );
}
