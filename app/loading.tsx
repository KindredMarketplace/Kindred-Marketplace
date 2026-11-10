import { BrandLoader } from '@/components/BrandLoader';

/** First screen while any page is on its way (replaces the blank white wait). */
export default function Loading() {
  return <BrandLoader variant="full" />;
}
