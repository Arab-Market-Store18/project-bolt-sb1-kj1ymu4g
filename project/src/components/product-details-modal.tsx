// المسار: components/product-details-modal.tsx
// النسخة النهائية: تم ربط قسم التقييمات مع Supabase وإزالة البيانات الوهمية

"use client";

import React, { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/utils/supabase/client"; // <-- استيراد عميل Supabase
import {
  Star, ShoppingCart, ChevronLeft, ChevronRight, Maximize2, X, MapPin,
  Tag, Package, Trash2, Loader2, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- الواجهات ---
interface Seller {
  id: string;
  businessName: string;
  logoUrl?: string | null;
  country?: string;
  city?: string;
  email?: string;
  phone?: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  images?: string[] | string | null;
  specifications?: { key: string; value: string }[];
  whatsapp_number?: string;
  phone_number?: string;
  currency?: string;
  condition?: string;
  stock?: number;
  seller: Seller;
}

// --- تعديل 1: واجهة جديدة للتقييمات ---
interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  // جلب اسم المستخدم وصورته من جدول المستخدمين المرتبط
  users: {
    full_name: string;
    avatar_url: string;
  } | null;
}

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onDelete?: (id: string) => void;
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  product,
  onDelete,
}: ProductDetailsModalProps) {
  const supabase = createSupabaseBrowserClient();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // --- تعديل 2: حالة جديدة لجلب وإدارة التقييمات ---
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  // جلب التقييمات عند تغيير المنتج
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product) return;

      setIsReviewsLoading(true);
      setReviews([]); // إفراغ التقييمات القديمة

      const { data, error } = await supabase
      .from('product_reviews')  // ✅ تم التغيير
      .select(`
        id,
        rating,
        comment,
        created_at,
        users (
          full_name,
          avatar_url
        )
      `)
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching reviews:", error);
      } else {
        setReviews(data || []);
      }
      setIsReviewsLoading(false);
    };

    if (isOpen) {
      fetchReviews();
    }
  }, [product, isOpen, supabase]);


  // إعادة تعيين حالة الصور عند تغيير المنتج
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsZoomed(false);
    setIsMaximized(false);
  }, [product]);

  if (!isOpen || !product) {
    return null;
  }

  const rawImages = product.images;
  const productImages = Array.isArray(rawImages) ? rawImages : (typeof rawImages === 'string' ? [rawImages] : ["/placeholder.svg"]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  const resetZoom = () => { setIsZoomed(false); setIsMaximized(false); };
  
  const seller = product.seller;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-right">{product.name}</DialogTitle>
          <DialogDescription className="text-right text-gray-600">{`الفئة: ${product.category}`}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow overflow-y-auto">
          <div className="p-6 pt-0">
            {/* قسم صور المنتج الرئيسي (بدون تغيير) */}
            <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-6">
              <img src={productImages[currentImageIndex] || "/placeholder.svg"} alt={product.name} className={`max-w-full max-h-full object-contain transition-transform duration-300 ${isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`} onClick={() => setIsZoomed(!isZoomed)} />
              {productImages.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70" onClick={prevImage}><ChevronLeft className="h-6 w-6" /></Button>
                  <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70" onClick={nextImage}><ChevronRight className="h-6 w-6" /></Button>
                </>
              )}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">{currentImageIndex + 1} / {productImages.length}</div>
              <Button variant="ghost" size="icon" className="absolute top-4 left-4 text-white bg-black/50 hover:bg-black/70" onClick={() => setIsMaximized(true)}><Maximize2 className="h-5 w-5" /></Button>
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-md overflow-x-auto p-1 bg-black/50 rounded-lg">
                  {productImages.map((image, index) => (
                    <button key={index} onClick={() => { setCurrentImageIndex(index); resetZoom(); }} className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex ? "border-white shadow-lg" : "border-gray-400 hover:border-gray-200"}`}>
                      <img src={image || "/placeholder.svg"} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* تفاصيل المنتج الأساسية (بدون تغيير) */}
            <div className="mb-6 border-b pb-4">
              <h3 className="text-3xl font-bold text-right">{product.name}</h3>
              <p className="text-2xl font-bold text-primary mt-3 text-right">{product.price?.toFixed(2)} {product.currency || "ريال"}</p>
              <p className="text-gray-700 mt-4 text-right leading-relaxed">{product.description}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 justify-end">
                {product.category && (<div className="flex items-center gap-2"><Tag className="h-5 w-5 text-gray-500" /> <span className="text-md text-gray-700">الفئة: {product.category}</span></div>)}
                {product.condition && (<div className="flex items-center gap-2"><Star className="h-5 w-5 text-gray-500" /> <Badge variant="outline" className="text-md">{product.condition === "new" ? "جديد" : "مستعمل"}</Badge></div>)}
                {product.stock !== undefined && (<div className="flex items-center gap-2"><Package className="h-5 w-5 text-gray-500" /> <span className="text-md text-gray-700">المخزون: {product.stock}</span></div>)}
              </div>
            </div>

            {/* معلومات التاجر (بدون تغيير) */}
            {seller && (
              <div className="mb-6 border-b pb-4 text-right">
                <h4 className="font-bold mb-3 text-xl">معلومات التاجر:</h4>
                <Card className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 shadow-sm">
                  <Avatar className="h-20 w-20 flex-shrink-0"><AvatarImage src={seller.logoUrl || "/placeholder-avatar.png"} alt={seller.businessName} /><AvatarFallback className="text-3xl">{seller.businessName ? seller.businessName.charAt(0) : "S"}</AvatarFallback></Avatar>
                  <div className="flex-grow text-center sm:text-right">
                    <h5 className="text-lg font-semibold mb-1">{seller.businessName}</h5>
                  </div>
                </Card>
              </div>
            )}
            
            {/* --- تعديل 3: قسم التقييمات الديناميكي --- */}
            <div className="mb-6">
              <h4 className="font-bold mb-3 text-xl text-right">التقييمات</h4>
              <Tabs defaultValue="reviews" dir="rtl">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reviews">التقييمات ({reviews.length})</TabsTrigger>
                  <TabsTrigger value="add-review">أضف تقييمك</TabsTrigger>
                </TabsList>
                <TabsContent value="reviews" className="mt-4">
                  {isReviewsLoading ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <Avatar>
                                <AvatarImage src={review.users?.avatar_url} />
                                <AvatarFallback>{review.users?.full_name?.charAt(0) || 'م'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold">{review.users?.full_name || "مستخدم مجهول"}</p>
                                  <div className="flex items-center gap-1 text-yellow-500">
                                    <span className="font-bold">{review.rating}</span>
                                    <Star className="h-4 w-4 fill-current" />
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">لا توجد تقييمات حالياً لهذا المنتج. كن أول من يضيف تقييماً!</p>
                  )}
                </TabsContent>
                <TabsContent value="add-review" className="mt-4">
                  <div className="text-center text-gray-500 py-8">
                    <p>نموذج إضافة تقييم جديد سيأتي هنا.</p>
                    {/* يمكنك بناء نموذج الإضافة هنا لاحقًا */}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-0 flex justify-end gap-2 border-t mt-auto">
          {onDelete && (<Button variant="destructive" onClick={() => onDelete(product.id)}><Trash2 className="h-4 w-4 ml-2" /> حذف المنتج</Button>)}
          <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white"><ShoppingCart className="h-4 w-4 ml-2" /> إضافة للسلة</Button>
        </div>
      </DialogContent>

      {/* نافذة تكبير الصورة (بدون تغيير) */}
      {isMaximized && productImages[currentImageIndex] && (
        <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
          <DialogContent className="fixed inset-0 w-screen h-screen max-w-none max-h-none bg-black flex items-center justify-center p-0">
            <img src={productImages[currentImageIndex]} alt={product.name} className="max-w-full max-h-full object-contain" />
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setIsMaximized(false)}><X className="h-8 w-8" /></Button>
            {productImages.length > 1 && (
              <>
                <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={prevImage}><ChevronLeft className="h-8 w-8" /></Button>
                <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20" onClick={nextImage}><ChevronRight className="h-8 w-8" /></Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}