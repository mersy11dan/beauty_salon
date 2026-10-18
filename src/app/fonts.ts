import {
  Alex_Brush,
  Allura,
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Dancing_Script,
  DM_Sans,
  DM_Serif_Display,
  Fraunces,
  Gilda_Display,
  Great_Vibes,
  Inter,
  Italiana,
  Italianno,
  Josefin_Sans,
  Jost,
  Karla,
  Lato,
  Lora,
  Manrope,
  Marcellus,
  Monsieur_La_Doulaise,
  Montserrat,
  Mrs_Saint_Delafield,
  Nunito,
  Outfit,
  Pacifico,
  Parisienne,
  Pinyon_Script,
  Playfair_Display,
  Poiret_One,
  Poppins,
  Prata,
  Quicksand,
  Raleway,
  Sacramento,
  Satisfy,
  Yeseva_One,
} from "next/font/google";

// Every face the admin can pick is declared here so its `--font-<id>` variable
// exists on <html>. Only the default trio is preloaded; the rest download the
// first time a page actually uses them.

const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const pinyon = Pinyon_Script({ variable: "--font-pinyon", subsets: ["latin"], weight: "400" });

const playfair = Playfair_Display({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-playfair" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-cormorant" });
const dmserif = DM_Serif_Display({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-dmserif", weight: "400" });
const italiana = Italiana({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-italiana", weight: "400" });
const cinzel = Cinzel({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-cinzel" });
const marcellus = Marcellus({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-marcellus", weight: "400" });
const prata = Prata({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-prata", weight: "400" });
const fraunces = Fraunces({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-fraunces" });
const yeseva = Yeseva_One({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-yeseva", weight: "400" });
const gilda = Gilda_Display({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-gilda", weight: "400" });
const poiret = Poiret_One({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-poiret", weight: "400" });
const josefin = Josefin_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-josefin" });

const greatvibes = Great_Vibes({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-greatvibes", weight: "400" });
const parisienne = Parisienne({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-parisienne", weight: "400" });
const allura = Allura({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-allura", weight: "400" });
const alexbrush = Alex_Brush({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-alexbrush", weight: "400" });
const italianno = Italianno({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-italianno", weight: "400" });
const monsieur = Monsieur_La_Doulaise({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-monsieur", weight: "400" });
const mrssaint = Mrs_Saint_Delafield({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-mrssaint", weight: "400" });
const sacramento = Sacramento({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-sacramento", weight: "400" });
const dancing = Dancing_Script({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-dancing" });
const satisfy = Satisfy({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-satisfy", weight: "400" });
const pacifico = Pacifico({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-pacifico", weight: "400" });

const inter = Inter({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-inter" });
const dmsans = DM_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-dmsans" });
const jost = Jost({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-jost" });
const montserrat = Montserrat({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-montserrat" });
const poppins = Poppins({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-poppins", weight: ["300", "400", "500", "600", "700"] });
const raleway = Raleway({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-raleway" });
const lato = Lato({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-lato", weight: ["300", "400", "700"] });
const nunito = Nunito({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-nunito" });
const quicksand = Quicksand({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-quicksand" });
const karla = Karla({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-karla" });
const outfit = Outfit({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-outfit" });
const lora = Lora({ subsets: ["latin"], preload: false, display: "swap", variable: "--font-lora" });

export const fontVariables = [
  bodoni, manrope, pinyon,
  playfair, cormorant, dmserif, italiana, cinzel, marcellus, prata, fraunces, yeseva, gilda, poiret, josefin,
  greatvibes, parisienne, allura, alexbrush, italianno, monsieur, mrssaint, sacramento, dancing, satisfy, pacifico,
  inter, dmsans, jost, montserrat, poppins, raleway, lato, nunito, quicksand, karla, outfit, lora,
]
  .map((f) => f.variable)
  .join(" ");
