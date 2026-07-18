// المسار: features/merchant/profile-merchant/index.ts


// تصدير المكونات
export { default as ProfileMerchantPage } from './ProfileMerchantPage';
export { ProfileMerchantInfoCard } from './components/sections/ProfileMerchantInfoCard';
export { ProfileMerchantProductsGrid } from './components/sections/ProfileMerchantProductsGrid';
export { ProfileMerchantReviewsList } from './components/sections/ProfileMerchantReviewsList';
export { ProfileMerchantTrust } from './components/sections/ProfileMerchantTrust';
export { ProfileMerchantFAQ } from './components/ui/ProfileMerchantFAQ';

// تصدير الأنواع
export type { 
  SellerData, 
  SellerReview, 
  ProductType, 
  Category, 
  FAQ, 
  PhoneNumber 
} from './types/profile-merchant.types';

// تصدير Hooks
export { useFitText } from './hooks/useFitText';

// تصدير Actions
export { 
  fetchSellerCoreData, 
  fetchSellerReviews, 
  toggleFollowSeller, 
  submitSellerReview 
} from './actions/profile-merchant.actions';

// تصدير Utils
export { 
  formatDate, 
  generateShareUrl, 
  getContactLink, 
  getArabicType, 
  getIconForType 
} from './utils/formatters';
