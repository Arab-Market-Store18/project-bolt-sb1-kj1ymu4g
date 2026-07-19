//features/merchant/profile-merchant/utils/formatters.ts


export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', { 
      hour: 'numeric', 
      minute: 'numeric', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  
  export const generateShareUrl = (sellerId: string): string => {
    return `${window.location.origin}/?seller_id=${sellerId}`;
  };
  
  export const getContactLink = (phone: PhoneNumber): string => {
    const cleanNumber = phone.number.replace(/\D/g, '');
    if (phone.type.toLowerCase() === 'whatsapp') {
      return `https://wa.me/${cleanNumber}`;
    }
    return `tel:${cleanNumber}`;
  };
  
  export const getArabicType = (type: string): string => {
    switch(type.toLowerCase()) {
      case 'whatsapp': return 'WhatsApp';
      case 'mobile': return 'Mobile';
      case 'landline': return 'Landline';
      default: return 'Phone';
    }
  };
  
  export const getIconForType = (type: string): string => {
    switch(type.toLowerCase()) {
      case 'whatsapp': return 'Smartphone';
      case 'mobile': return 'Smartphone';
      default: return 'Phone';
    }
  };
