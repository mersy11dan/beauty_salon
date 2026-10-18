import { Hero } from "@/components/site/hero";
import {
  AboutBlock,
  OffersBand,
  PortfolioStrip,
  ReviewsPreview,
  ServicesPreview,
  VisitBlock,
} from "@/components/site/home-sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <PortfolioStrip />
      <AboutBlock />
      <OffersBand />
      <ReviewsPreview />
      <VisitBlock />
    </>
  );
}
