# BoutikPro — Guide de Présentation Client

## Application de Gestion de Quincaillerie & Matériaux de Construction

**Éditeur :** BoutikPro SaaS
**Cible :** Quincailleries, dépôts de matériaux et réseaux multi-boutiques — Abidjan / UEMOA
**Devise :** FCFA (XOF)
**Version :** 1.0 — Octobre 2026

---

## AVANT-PROPOS

Ce document présente le fonctionnement de BoutikPro à travers le **cycle de vie complet d'une boutique de matériaux**, depuis l'ouverture du compte jusqu'aux rapports de fin de journée. Chaque module est illustré par des actions concrètes, dans l'ordre chronologique où un gérant ou un caissier les utiliserait au quotidien.

Le fil conducteur : la quincaillerie **COULIBALY & Frères**, deux points de vente (Cocody et Abobo), une journée type du lundi matin à la clôture.

---

## ACTE 1 — L'OUVERTURE DU COMPTE : LA BOUTIQUE ET SES UTILISATEURS

### Situation

M. Coulibaly Mamadou dirige une quincaillerie à Cocody et vient d'ouvrir un second point de vente à Abobo. Jusqu'ici, tout était géré sur un cahier et un fichier Excel partagé par WhatsApp.

### Ce qui est mis en place dans BoutikPro

**Page d'accueil → Créer ma boutique**

Il crée son compte lui-même, en moins d'une minute : nom du commerce, nom du premier magasin, son nom, email, téléphone, mot de passe. Aucun installateur, aucun rendez-vous commercial, aucune intervention de l'éditeur.

À la validation, BoutikPro crée d'un seul geste l'**espace isolé** de la boutique (plan `STARTER`), son **premier magasin** et son **compte propriétaire** — et le connecte directement à son tableau de bord.

**Menu → Magasins → Nouveau magasin**

Le propriétaire crée lui-même ses points de vente, sans passer par l'éditeur :

- Nom du magasin, adresse, téléphone
- Ici : _COULIBALY & Frères — Cocody_, puis _COULIBALY & Frères — Abobo_
- Un magasin peut être désactivé sans perdre son historique

Chaque magasin a **son propre stock, ses ventes et ses caissiers**. Le propriétaire bascule de l'un à l'autre depuis le sélecteur en haut de l'écran, ou consulte la vue consolidée.

**Menu → Utilisateurs** — le propriétaire crée lui-même les comptes de son équipe ; chaque collaborateur reçoit un compte nominatif, un rôle, et éventuellement un magasin de rattachement :

| Rôle                       | Ce qu'il peut faire                                                     |
| -------------------------- | ----------------------------------------------------------------------- |
| **PROPRIÉTAIRE** (OWNER)   | Tout sur ses magasins : prix, marges, utilisateurs, rapports consolidés |
| **GÉRANT** (MANAGER)       | Exploitation complète d'un magasin : ventes, stock, commandes, clients  |
| **CAISSIER** (CASHIER)     | Caisse, ventes, consultation produits et clients                        |
| **COMPTABLE** (ACCOUNTANT) | Rapports, trésorerie, créances, exports                                 |
| **SUPER ADMIN**            | Éditeur uniquement : gestion du réseau de boutiques                     |

> **Ce que voit le client :** chaque boutique est totalement **isolée** des autres (architecture multi-tenant). Un caissier ne voit jamais les marges, un gérant ne voit jamais les données d'une autre enseigne.

---

## ACTE 2 — LE CATALOGUE : LES PRODUITS

### Situation

Avant de vendre, il faut inventorier ce que la boutique propose : ciment, fer à béton, tôle, peinture, carrelage, plomberie, électricité, bois, agrégats.

### Ce que fait le gérant

**Menu → Produits → Nouveau produit**

Il renseigne pour chaque article :

- **Référence** unique (ex : `CIM-001`) et désignation complète
- **Catégorie** — libre, définie par la boutique elle-même (**Produits → Catégories**) : ici Ciment, Fer à béton, Tôle, Peinture, Carrelage, Plomberie, Électricité, Bois, Agrégats. Un commerce d'un autre secteur crée simplement les siennes ; des jeux prêts à l'emploi sont proposés au démarrage.
- **Unité de vente** : sac, barre, feuille, bidon, m², m³, rouleau, pièce — texte libre
- **Prix d'achat** et **prix de vente**
- **Seuil d'alerte** (quantité minimale avant réapprovisionnement)

Exemple réel du catalogue :

```
Réf.      Désignation                            Achat     Vente     Unité     Seuil
CIM-001   Ciment Portland CPJ 42,5 – 50 kg       4 200     5 500     sac        20
FER-002   Fer à béton Ø10mm × 12m                8 000    10 500     barre      10
TOL-001   Tôle galvanisée 0,5mm – 1×2m           3 200     4 200     feuille    10
CAR-001   Carrelage sol 60×60 – Gris béton       7 500    10 000     m²         20
AUT-001   Gravier 15/25                         15 000    20 000     m³          5
```

**BoutikPro calcule automatiquement** la marge unitaire et le taux de marge de chaque produit — ici, 1 300 FCFA et 23,6 % sur le sac de ciment.

> **Ce que cela apporte :** le propriétaire sait enfin, article par article, ce qu'il gagne réellement. La marge n'est plus une estimation de fin de mois, c'est une donnée calculée à chaque vente.

---

## ACTE 3 — LES FOURNISSEURS ET LE BON DE COMMANDE

### Situation

Le stock de ciment est tombé sous le seuil. Le gérant commande 200 sacs de CPJ 42,5 chez **DANGOTE Ciments CI**.

### Ce que fait le gérant

**Menu → Fournisseurs → Nouveau fournisseur**

- Raison sociale, téléphone, email
- Personne de contact (ex : M. Sangaré Lamine)

**Menu → Fournisseurs → Bons de commande → Nouvelle commande**

- Fournisseur : DANGOTE Ciments CI
- Magasin de livraison : Cocody
- Lignes de commande : produit, quantité, prix d'achat négocié

BoutikPro génère une **référence de commande unique et horodatée**, et suit son statut :

```
BROUILLON  →  ENVOYÉE  →  PARTIELLE  →  RÉCEPTIONNÉE
                                    ↘  ANNULÉE
```

> **Ce que cela apporte :** plus de commandes passées par téléphone et oubliées. Le gérant sait à tout moment ce qui est commandé, ce qui est arrivé, et ce qui manque encore.

---

## ACTE 4 — LA RÉCEPTION DE MARCHANDISE

### Situation

Lundi 8h. Le camion DANGOTE se présente au dépôt de Cocody avec les 200 sacs.

### Ce que fait le gérant

**Menu → Fournisseurs → Bons de commande → Réceptionner la marchandise**

La fenêtre de réception affiche chaque article commandé avec sa quantité attendue. Le gérant saisit la **quantité physiquement reçue** — ici 200 sacs confirmés — puis valide.

**BoutikPro enregistre immédiatement :**

```
Stock « Ciment CPJ 42,5 » — Cocody :   0  →  200 sacs
Mouvement de stock                 :   ENTRÉE, horodaté, nominatif
Statut du bon de commande          :   RÉCEPTIONNÉ
Alerte stock bas                   :   levée automatiquement
```

Si seuls 150 sacs sont livrés, la commande passe en **PARTIELLE** et le reliquat de 50 sacs reste suivi.

> **Ce que cela apporte :** le stock n'est jamais ressaisi à la main. Ce qui entre physiquement est ce qui entre dans le système, avec la preuve de qui l'a réceptionné et quand.

---

## ACTE 5 — LA VENTE AU COMPTOIR : LA CAISSE

### Situation

Premier client de la matinée : M. Koné Amadou vient acheter de quoi construire sa clôture.

### Ce que fait le caissier

**Menu → Caisse**

L'écran de caisse s'ouvre : recherche produit à gauche, panier à droite. La recherche fonctionne **par désignation ET par référence** — pratique pour les caissiers qui connaissent les codes.

| Article                 | Quantité | P.U.   | Total   |
| ----------------------- | -------- | ------ | ------- |
| Ciment CPJ 42,5 – 50 kg | 20 sacs  | 5 500  | 110 000 |
| Fer à béton Ø10mm × 12m | 5 barres | 10 500 | 52 500  |
| Gravier 15/25           | 2 m³     | 20 000 | 40 000  |

1. **Remise fidélité** : 2 500 FCFA sur le ciment → le total se recalcule en temps réel
2. **Client associé** : rechercher « Koné » → son éventuel solde de crédit s'affiche immédiatement
3. **Encaissement** : mode de paiement **Espèces**, montant reçu 210 000 FCFA

```
Sous-total            :  202 500 FCFA
Remise                :  - 2 500 FCFA
─────────────────────────────────────
NET À PAYER           :  200 000 FCFA
Reçu (espèces)        :  210 000 FCFA
MONNAIE À RENDRE      :   10 000 FCFA
```

**Modes de paiement acceptés :** Espèces, **Orange Money**, **Wave**, **MTN Money**, Virement, Crédit client.

**Ce qui se passe automatiquement à la validation :**

- Le stock de chaque article est décrémenté (mouvement `SORTIE`)
- Un **numéro de ticket unique** est généré
- La vente apparaît dans l'historique, consultable par date, caissier et magasin
- Le **reçu PDF** est téléchargeable : nom de la boutique, coordonnées, numéro de ticket, détail des lignes, mode de paiement

> **Point clé :** chaque ligne de vente **fige le prix du moment**. Si le prix du ciment change demain, les ventes d'hier ne bougent pas — la comptabilité reste juste.

---

## ACTE 6 — LA VENTE À CRÉDIT

### Situation

Deuxième cliente : Mme Traoré Mariam, habituée de la maison. Elle prend 50 sacs de ciment mais ne peut régler qu'une partie aujourd'hui.

### Ce que fait le caissier

**Menu → Caisse** → panier de 50 sacs = **275 000 FCFA** → cliente **Mme Traoré Mariam** → mode de paiement **Crédit client**.

- Montant payé comptant : **100 000 FCFA**
- Reste dû : **175 000 FCFA**

**Ce qui se passe :**

```
Statut de la vente          :  CRÉDIT EN COURS
Solde client Mme Traoré     :  0  →  175 000 FCFA
Créances du tableau de bord :  mises à jour en temps réel
Stock                       :  décrémenté (la marchandise est sortie)
```

> **Ce que cela apporte :** le crédit client, pratique universelle du secteur, sort enfin du cahier. Chaque dette a un nom, un montant, une date et une vente d'origine.

---

## ACTE 7 — L'ENCAISSEMENT D'UNE DETTE CLIENT

### Situation

Dans l'après-midi, Mme Traoré revient payer une partie de ce qu'elle doit.

### Ce que fait le gérant

**Menu → Clients → fiche Mme Traoré → Encaisser un paiement**

- Montant : **100 000 FCFA**
- Mode : **Orange Money**

```
Solde avant   :  175 000 FCFA
Paiement      : -100 000 FCFA
─────────────────────────────
Solde après   :   75 000 FCFA
```

Le paiement est archivé dans l'**historique de la cliente** : date, montant, mode, utilisateur qui a encaissé. La fiche client affiche l'intégralité de ses achats et de ses règlements.

> **Ce que cela apporte :** fini les discussions « j'avais déjà payé ». L'historique est horodaté et consultable en 5 secondes devant le client.

---

## ACTE 8 — LE PILOTAGE DU STOCK

### Situation

Le gérant veut vérifier l'état réel du stock et corriger un écart constaté au comptage physique.

### Ce que fait le gérant

**Menu → Stock** — trois onglets :

**1. Stocks** — quantité disponible de chaque produit, **par magasin**. Les articles sous le seuil d'alerte sont en surbrillance.

**2. Mouvements** — l'historique intégral, ligne par ligne :

| Type de mouvement               | Déclencheur                                      |
| ------------------------------- | ------------------------------------------------ |
| **ENTRÉE**                      | Réception d'une commande fournisseur             |
| **SORTIE**                      | Vente en caisse                                  |
| **TRANSFERT ENTRANT / SORTANT** | Mouvement entre deux magasins                    |
| **AJUSTEMENT**                  | Correction après comptage physique, casse, perte |

Chaque ligne indique le produit, la quantité, le motif, l'utilisateur et l'horodatage.

**3. Alertes** — badge rouge, liste des produits à réapprovisionner d'urgence.

### L'ajustement de stock

**Stock → Ajustement** : produit, quantité corrigée, **motif obligatoire** (ex : « Comptage physique du 10/10 — 3 sacs éventés »).

> **Point clé :** un ajustement ne supprime rien. Il **ajoute** un mouvement tracé et irréversible. Personne ne peut faire disparaître discrètement de la marchandise.

---

## ACTE 9 — LE TRANSFERT ENTRE MAGASINS

### Situation

Le dépôt d'Abobo est en rupture de tôle galvanisée alors que Cocody en a en surplus.

### Ce que fait le gérant

**Menu → Stock → Transfert**

- Magasin source : Cocody — Magasin destination : Abobo
- Articles et quantités transférés

BoutikPro enregistre **deux mouvements liés** : `TRANSFERT SORTANT` à Cocody, `TRANSFERT ENTRANT` à Abobo. Le stock global du réseau reste constant, seule la répartition change.

> **Ce que cela apporte :** le propriétaire multi-boutiques pilote son stock comme un seul pool, sans racheter ce qu'il possède déjà à 20 minutes de route.

---

## ACTE 10 — LE TABLEAU DE BORD TEMPS RÉEL

### Situation

Le propriétaire est en déplacement. Il veut savoir, depuis son téléphone, comment tourne la boutique.

### Ce que fait BoutikPro

**Menu → Tableau de bord**

- **Chiffre d'affaires du jour** et nombre de ventes
- **Panier moyen**
- **Alertes stock** — nombre de produits sous le seuil (cliquable → page Stock)
- **Créances clients** — total des dettes en cours
- **Graphique du CA** des 7 derniers jours
- **Top des produits les plus vendus**
- **Sélecteur de magasin** en haut à droite : Cocody, Abobo, ou vue consolidée

> **Ce que cela apporte :** le propriétaire n'a plus besoin d'appeler la boutique pour savoir comment va la journée. L'information est devant lui, à jour à la seconde.

---

## ACTE 11 — LES RAPPORTS DE FIN DE JOURNÉE

### Situation

18h, fermeture. Le propriétaire veut les chiffres avant de rentrer.

### Ce que fait BoutikPro

**Menu → Rapports** — période pré-remplie sur la journée, modifiable (semaine, mois, plage libre).

**Onglet Ventes**

- Chiffre d'affaires total, nombre de ventes, panier moyen
- Courbe des ventes par heure / par jour
- **Répartition par mode de paiement** : Espèces, Orange Money, Wave, MTN Money, Virement, Crédit

**Onglet Trésorerie**

```
Encaissements de la journée      :  Σ des règlements reçus
Coût d'achat des produits vendus :  Σ (prix d'achat × quantités)
──────────────────────────────────────────────────────────────
MARGE BRUTE                      :  calculée automatiquement
TAUX DE MARGE                    :  en %
```

Sur la vente de M. Koné : 200 000 FCFA encaissés, 154 000 FCFA de coût d'achat → **46 000 FCFA de marge, soit 23 %**. Sans aucune saisie supplémentaire.

**Onglet Dettes**

Liste de tous les clients débiteurs, montant dû par client, **total global des créances**. C'est la liste de relance du gérant.

### L'export Excel

**Bouton « Exporter Excel »** — le fichier se télécharge instantanément : détail ligne par ligne, exploitable par le comptable, envoyable par WhatsApp.

> **Message clé :** le point de caisse qui prenait une soirée de calculs sur cahier est disponible en un clic, à la fermeture, sans erreur d'addition.

---

## ACTE 12 — LE TERRAIN : MOBILE, PWA ET NOTIFICATIONS

### Situation

La boutique n'a pas de bureau informatique. Le gérant travaille sur son téléphone, parfois en 3G, parfois sous l'auvent du dépôt.

### Ce que fait BoutikPro

- **Conception mobile-first** : l'interface est pensée pour un écran de 390 px avant de l'être pour un ordinateur
- **PWA installable** : l'application s'ajoute à l'écran d'accueil Android et iPhone, comme une appli native, sans passer par un store
- **Navigation basse** sur mobile : Accueil, Caisse, Ventes, Stock, Rapports — accessibles au pouce
- **Notifications push** : alerte de stock bas, événements de vente, suivi des créances
- **Résilience réseau** : chargement optimisé pour les connexions lentes, les dernières données consultées restent affichées

> **Ce que cela apporte :** aucun investissement matériel. Le caissier encaisse avec le téléphone qu'il a déjà dans la poche.

---

## ACTE 13 — LA SÉCURITÉ ET LE CONTRÔLE D'ACCÈS

### Situation

Le propriétaire veut que ses caissiers encaissent, mais ne voient ni les prix d'achat, ni les marges, ni les données des autres magasins.

### Ce que fait BoutikPro

| Protection                        | Mise en œuvre                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------ |
| **Isolation des données**         | Multi-tenant : chaque boutique est cloisonnée au niveau de la base             |
| **Rôles**                         | Propriétaire / Gérant / Caissier / Comptable, avec permissions distinctes      |
| **Mots de passe**                 | Chiffrés (bcrypt), jamais stockés en clair, réinitialisation par email         |
| **Double authentification (2FA)** | Activable par compte pour les rôles sensibles                                  |
| **Sessions**                      | Expiration automatique après inactivité, jetons de rafraîchissement révocables |

> **Ce que cela apporte :** le patron délègue l'exploitation sans déléguer le secret de ses marges.

---

## ACTE 14 — LA TRAÇABILITÉ : LE JOURNAL D'AUDIT

### Situation

Un écart de caisse est constaté sur la semaine. Le propriétaire veut comprendre, sans accuser personne à tort.

### Ce que fait BoutikPro

**Panneau d'administration → Journaux d'audit**

Chaque action sensible est enregistrée :

- L'**action** effectuée (connexion, modification de prix, annulation de vente, ajustement de stock, suppression)
- L'**identité** de l'utilisateur
- La **date et l'heure exactes**
- L'**adresse IP** de la machine
- La **valeur avant / après** modification

> **Message clé :** BoutikPro est un **système de preuve**. Une vente annulée, un prix modifié, un stock ajusté — tout laisse une trace nominative et horodatée que personne ne peut effacer.

---

## ACTE 15 — LE RÉSEAU : LE PANNEAU D'ADMINISTRATION

### Situation

Un groupement de quincailleries, ou un franchiseur, veut piloter plusieurs enseignes depuis un seul poste.

### Ce que fait BoutikPro

**Panneau Super Admin** (interface séparée)

- **Tableau de bord réseau** : nombre de boutiques actives, utilisateurs, ventes consolidées
- **Gestion des boutiques** : créer une enseigne, choisir son plan (`STARTER` / `PRO` / `ENTERPRISE`), activer ou suspendre
- **Gestion des utilisateurs** : tous les comptes, leur boutique, leur rôle
- **Journaux d'audit globaux** sur l'ensemble du réseau

> **Ce que cela apporte :** le modèle SaaS est complet. On ouvre le compte d'une nouvelle quincaillerie en quelques minutes, sans installation ni déplacement.

---

## RÉCAPITULATIF — UN ÉCOSYSTÈME INTÉGRÉ

```
BOUTIQUE (tenant) ──────┐
   │                    │
   ├── MAGASINS         │  Cocody / Abobo / …  (créés par le propriétaire)
   ├── UTILISATEURS     │  Propriétaire · Gérant · Caissier · Comptable
   ├── CATÉGORIES       │  Libres, propres à l'activité
   │                    │
   ▼                    │
PRODUITS ───────────────┤  Prix achat / vente · marge auto · seuil d'alerte
   │                    │
   ▼                    │
FOURNISSEURS ───────────┤  Bons de commande · suivi des statuts
   │                    │
   ▼                    │
RÉCEPTION ──────────────┤  Mouvement ENTRÉE
   │                    │
   ▼                    │
STOCK ──────────────────┤  Entrées · Sorties · Transferts · Ajustements
   │   │                │
   │   └── ALERTES ─────┤  Seuil minimum → notification push
   │                    │
   ▼                    │
CAISSE ─────────────────┤  Espèces · Orange Money · Wave · MTN · Virement
   │                    │
   ├── VENTE COMPTANT ──┤  Reçu PDF · stock décrémenté
   │                    │
   └── VENTE À CRÉDIT ──┤
            │           │
            ▼           │
       CLIENTS ─────────┤  Solde · historique · encaissements
            │           │
            ▼           │
   ┌────────┴────────┐  │
   ▼                 ▼  │
TABLEAU DE BORD   RAPPORTS ─── Ventes · Trésorerie / Marge · Dettes
                     │
                     ▼
                EXPORT EXCEL
                     │
                     ▼
            JOURNAL D'AUDIT (immuable)
```

---

## AVANTAGES CLÉS POUR LE CLIENT (RÉSUMÉ DÉCIDEUR)

| Avant BoutikPro                                   | Avec BoutikPro                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Cahier de caisse, additions manuelles             | Caisse numérique, totaux et monnaie calculés                         |
| Stock connu « à peu près », ruptures subies       | Stock à la seconde, alerte automatique au seuil                      |
| Crédits clients dans un carnet, litiges fréquents | Solde par client, historique horodaté                                |
| Marge estimée en fin de mois, parfois jamais      | Marge brute calculée à chaque vente                                  |
| Point de caisse = une soirée de calculs           | Rapport complet en un clic, export Excel                             |
| Aucune visibilité à distance sur la boutique      | Tableau de bord temps réel sur téléphone                             |
| Impossible de savoir qui a modifié quoi           | Journal d'audit nominatif, horodaté, avec IP                         |
| Chaque magasin géré séparément                    | Vue consolidée + transferts inter-magasins                           |
| Logiciel à installer, serveur à acheter           | SaaS, PWA installable, aucun matériel                                |
| Outil pensé pour un seul métier                   | Catégories libres : quincaillerie, épicerie, pharmacie, pièces auto… |
| Mise en service longue, dépendante du fournisseur | Compte créé en autonomie, opérationnel en une minute                 |

---

## ACCÈS DE DÉMONSTRATION

| Profil            | Email                 | Mot de passe | Ce qu'il voit                                             |
| ----------------- | --------------------- | ------------ | --------------------------------------------------------- |
| Propriétaire      | proprietaire@demo.com | Demo1234!    | Tous ses magasins, marges, rapports consolidés            |
| Gérant            | manager@demo.com      | Demo1234!    | Exploitation complète : caisse, stock, commandes, clients |
| Caissier (Cocody) | caissier@demo.com     | Demo1234!    | Caisse, ventes, produits, clients                         |
| Caissier (Abobo)  | caissier2@demo.com    | Demo1234!    | Caisse du magasin d'Abobo                                 |
| Super Admin       | admin@materiaux.com   | Admin1234!   | Pilotage du réseau de boutiques                           |

> Le jeu de démonstration contient la quincaillerie **COULIBALY & Frères** (plan PRO) avec **2 magasins**, **18 références** réparties sur 9 catégories, **24 clients** (dont plusieurs avec créances en cours), **6 fournisseurs** et un **historique de ventes sur 4 semaines** — tous modes de paiement représentés, ventes à crédit incluses, pour illustrer chaque module en situation réelle.

---

### Déroulé recommandé pour une démonstration de 30 minutes

| Temps       | Séquence                                  | Actes |
| ----------- | ----------------------------------------- | ----- |
| 0 – 3 min   | Connexion mobile + tableau de bord        | 10    |
| 3 – 8 min   | Réception d'une livraison fournisseur     | 3 – 4 |
| 8 – 16 min  | Vente au comptoir + reçu PDF              | 5     |
| 16 – 21 min | Vente à crédit + encaissement d'une dette | 6 – 7 |
| 21 – 25 min | Stock : mouvements, ajustement, alertes   | 8 – 9 |
| 25 – 30 min | Rapports, marge, export Excel             | 11    |
| _Optionnel_ | Panneau d'administration réseau           | 15    |

---

_BoutikPro v1.0_
_Document de présentation commerciale — Octobre 2026_
_Confidentiel — Usage interne et présentation client uniquement_
