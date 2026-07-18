// features/merchant/product-view/utils/formatters.ts
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
