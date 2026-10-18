import { Hero } from "@/components/site/hero";
import {
  AboutBlock,
  OffersBand,
  PortfolioStrip,
  ReviewsPreview,
  ScriptMarquee,
  ServicesPreview,
  VisitBlock,
} from "@/components/site/home-sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScriptMarquee />
      <ServicesPreview />
      <PortfolioStrip />
      <AboutBlock />
      <OffersBand />
      <ReviewsPreview />
      <VisitBlock />
    </>
  );
}
