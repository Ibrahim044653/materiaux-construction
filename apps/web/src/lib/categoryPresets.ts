// Jeux de catégories proposés au démarrage d'une nouvelle boutique.
// Ce ne sont que des suggestions : chaque commerce crée ensuite les siennes.
export const CATEGORY_PRESETS: { value: string; label: string; categories: string[] }[] = [
  {
    value: 'MATERIAUX',
    label: 'Matériaux de construction',
    categories: [
      'Ciment',
      'Fer à béton',
      'Tôle',
      'Peinture',
      'Carrelage',
      'Plomberie',
      'Électricité',
      'Bois',
      'Agrégats',
    ],
  },
  {
    value: 'ALIMENTATION',
    label: 'Alimentation / Épicerie',
    categories: [
      'Boissons',
      'Céréales et farines',
      'Conserves',
      'Produits frais',
      'Hygiène',
      'Entretien',
    ],
  },
  {
    value: 'PHARMACIE',
    label: 'Pharmacie / Parapharmacie',
    categories: [
      'Antalgiques',
      'Antibiotiques',
      'Dermatologie',
      'Hygiène',
      'Matériel médical',
      'Compléments',
    ],
  },
  {
    value: 'PIECES_AUTO',
    label: 'Pièces détachées auto',
    categories: [
      'Moteur',
      'Freinage',
      'Suspension',
      'Électricité',
      'Carrosserie',
      'Pneumatiques',
      'Lubrifiants',
    ],
  },
  {
    value: 'PRET_A_PORTER',
    label: 'Prêt-à-porter',
    categories: ['Homme', 'Femme', 'Enfant', 'Chaussures', 'Accessoires'],
  },
  {
    value: 'ELECTRONIQUE',
    label: 'Électronique / Téléphonie',
    categories: ['Téléphones', 'Ordinateurs', 'Accessoires', 'Audio', 'Électroménager'],
  },
];
