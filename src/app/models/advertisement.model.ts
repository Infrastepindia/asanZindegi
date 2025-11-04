export interface Advertisement {
  categoryId: number;
  categoryName: string;
  priceStartForm: string;
  priceType: string;
  serviceOverview: string;
  areaCoveredPolygon?: string;
  videoLink?: string;
  detailDescription: string;
  availabilityHours?: string;
  advertisementImage?: string; // preview data URL
  images?: File[]; // advertisement images attached to this ad
}
