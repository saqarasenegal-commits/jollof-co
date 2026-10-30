/**
 * Admin texts, in French (the owner's language).
 * To add English or Arabic, follow apps/customer/src/i18n.ts.
 */
import type { PortionsError, PriceError, Region, Section } from "@jollofco/core";

export const L = {
  title: "Administration",
  tabs: { menu: "Menu et prix", portions: "Portions par jour" },
  sections: {
    mains: "Plats",
    sides: "Accompagnements",
    drinks: "Boissons",
    desserts: "Desserts",
    combos: "Formules",
  } as Record<Section, string>,
  regions: { west: "Ouest", east: "Est", north: "Nord" } as Record<Region, string>,
  dishOfTheDay: "plat du jour",
  onMenu: "En vente",
  offMenu: "Retiré",
  save: "Enregistrer",
  saved: "Enregistré",
  price: "Prix (QAR)",
  sold: (n: number) => `${n} vendues`,
  priceErrors: {
    "not-a-number": "Entrez un nombre, par exemple 45 ou 45,50.",
    negative: "Le prix ne peut pas être négatif.",
    "too-many-decimals": "Deux chiffres après la virgule au maximum.",
    "too-high": "Prix trop élevé, vérifiez le nombre de zéros.",
  } as Record<PriceError, string>,
  portionsErrors: {
    "not-a-number": "Entrez un nombre entier.",
    "below-sold": "Impossible : c'est moins que les portions déjà vendues.",
    "too-high": "Nombre trop élevé, vérifiez.",
  } as Record<PortionsError, string>,
  saveFailed: "Pas enregistré : vérifiez la connexion et réessayez.",
  signOut: "Se déconnecter",
  demoNotice:
    "Mode démonstration : les changements ne sont pas enregistrés (fichier .env absent, voir le README).",
};
