export interface Intervention {
  id: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  deltaPct: number;
  completed: boolean;
  hasHepaToggle?: boolean;
}

export const INITIAL_INTERVENTIONS: Intervention[] = [
  {
    id: 'morning-walk-shift',
    titleEn: 'Morning Walk → Indoor Stretch',
    titleHi: 'सुबह की सैर → इनडोर स्ट्रेचिंग व योग',
    subtitleEn: 'Completed at 7:15 AM',
    subtitleHi: 'प्रातः 7:15 बजे संपन्न',
    deltaPct: 24,
    completed: true,
  },
  {
    id: 'bedroom-purifier-night',
    titleEn: 'Seal Bedroom & Run Purifier',
    titleHi: 'कमरे को सील करें व एयर प्यूरीफायर चलाएं',
    subtitleEn: 'Living Room HEPA',
    subtitleHi: 'लिविंग रूम HEPA फ़िल्टर',
    deltaPct: 32,
    completed: false,
    hasHepaToggle: true,
  },
  {
    id: 'n95-mask-commute',
    titleEn: 'Equip N95 for School Drop',
    titleHi: 'स्कूल ड्रॉप के लिए N95 मास्क पहनाएं',
    subtitleEn: "In-hand (Kid's Small) • Effort: 3 mins",
    subtitleHi: 'छोटा आकार • केवल 3 मिनट का समय',
    deltaPct: 18,
    completed: false,
  },
];
