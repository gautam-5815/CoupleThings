/**
 * Every picture on the public pages, with its source and licence.
 * Downloaded from open collections by the design skill's assets.mjs;
 * the full records are in assets/credits.json at the repo root.
 * All are public domain (CC0) via the Art Institute of Chicago.
 * None of them is presented as a picture of this product or its users.
 */
export type Picture = {
  src: string;
  alt: string;
  title: string;
  creator: string | null;
  date: string;
  page: string;
  width: number;
  height: number;
};

export const pictures = {
  loveMeOrIDie: {
    src: "/archive/love-me-or-i-die-valentine.jpg",
    alt: "A hand-coloured Victorian valentine cut from embossed lace paper, with a collaged bouquet at its centre.",
    title: "Love Me or I Die (Valentine)",
    creator: "Joseph Addenbrooke",
    date: "c. 1840",
    page: "https://www.artic.edu/artworks/75859",
    width: 1920,
    height: 2342,
  },
  toMyDearValentine: {
    src: "/archive/to-my-dear-valentine-valentine.jpg",
    alt: "A Victorian valentine of cut lace paper with watercolour flowers and a handwritten verse in brown ink.",
    title: "To My Dear Valentine (valentine)",
    creator: "George Kershaw",
    date: "c. 1840",
    page: "https://www.artic.edu/artworks/75834",
    width: 1827,
    height: 2784,
  },
  sayShallIConquer: {
    src: "/archive/say-shall-i-conquer-valentine.jpg",
    alt: "A lace-paper valentine with collaged elements and watercolour, inscribed 'Say Shall I Conquer'.",
    title: "Say Shall I Conquer (valentine)",
    creator: "Joseph Addenbrooke",
    date: "c. 1840",
    page: "https://www.artic.edu/artworks/75792",
    width: 1845,
    height: 2277,
  },
  hummingbird: {
    src: "/archive/hummingbird-valentine.jpg",
    alt: "An elaborate valentine made of cloth and feather flowers around a die-cut hummingbird.",
    title: "Hummingbird Valentine",
    creator: "Jonathan King",
    date: "1845/1869",
    page: "https://www.artic.edu/artworks/26003",
    width: 1920,
    height: 2880,
  },
  rememberTheGiver: {
    src: "/archive/remember-the-giver-valentine.jpg",
    alt: "A hand-coloured engraved valentine on ivory card, inscribed 'Remember the Giver'.",
    title: "Remember the Giver (valentine)",
    creator: null,
    date: "c. 1830",
    page: "https://www.artic.edu/artworks/138681",
    width: 1548,
    height: 878,
  },
  billetDoux: {
    src: "/archive/le-billet-doux-the-love-letter.jpg",
    alt: "An eighteenth-century engraving of a woman seated with a letter in her lap, a dog beside her.",
    title: "Le Billet Doux (The Love Letter)",
    creator: "Nicolas Delaunay",
    date: "1778",
    page: "https://www.artic.edu/artworks/30204",
    width: 1920,
    height: 2664,
  },
  theLoveLetter: {
    src: "/archive/the-love-letter.jpg",
    alt: "A colour woodblock print of two figures reading a letter together.",
    title: "The Love Letter",
    creator: "Suzuki Harunobu",
    date: "1765",
    page: "https://www.artic.edu/artworks/11029",
    width: 1920,
    height: 2438,
  },
  newYearsWish: {
    src: "/archive/the-new-year-s-wish-holiday-card.jpg",
    alt: "An embossed ivory greeting card of about 1840 with a collaged element and grey paint.",
    title: "The New Year's Wish (holiday card)",
    creator: "John Windsor",
    date: "c. 1840",
    page: "https://www.artic.edu/artworks/129036",
    width: 1920,
    height: 2460,
  },
} satisfies Record<string, Picture>;

export const allPictures: Picture[] = Object.values(pictures);

export function creditLine(p: Picture) {
  return [
    `“${p.title}”`,
    p.creator,
    p.date,
    "public domain (CC0), Art Institute of Chicago",
  ]
    .filter(Boolean)
    .join(", ");
}
