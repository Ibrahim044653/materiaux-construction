# MatériauxPro — Scénario de démonstration client

**Durée estimée :** 30 à 45 minutes  
**Public :** Propriétaire / Gérant d'une quincaillerie  
**Objectif :** Montrer que MatériauxPro couvre le cycle complet d'une journée de vente, de la réception de marchandise jusqu'aux rapports de fin de journée.

---

## Contexte du scénario

> "Nous sommes dans la quincaillerie **COULIBALY & Frères** à Cocody.
> C'est lundi matin. Le gérant ouvre la boutique, réceptionne une livraison
> de ciment, réalise plusieurs ventes, encaisse un remboursement de dette client,
> puis consulte les chiffres de la journée."

---

## Accès de démonstration

| Rôle         | URL                   | Email               | Mot de passe |
| ------------ | --------------------- | ------------------- | ------------ |
| Gérant (web) | http://localhost:5173 | manager@demo.com    | Demo1234!    |
| Super Admin  | http://localhost:3002 | admin@materiaux.com | Admin1234!   |

---

## ACTE 1 — Connexion et tableau de bord (3 min)

### 1.1 Connexion

1. Ouvrir http://localhost:5173 sur **mobile** (ou réduire la fenêtre à 375 px).
2. Saisir les identifiants du gérant → cliquer **Se connecter**.
3. **Point à souligner :** la page se charge en moins de 2 secondes même sur connexion 3G simulée.

### 1.2 Tableau de bord

Après connexion, le tableau de bord s'affiche automatiquement.

**Ce qu'on voit :**

- **Chiffre d'affaires du jour** : 0 FCFA (c'est lundi matin)
- **Ventes du jour** : 0
- **Alertes stock** : nombre de produits sous le seuil minimum
- **Créances clients** : total des dettes en cours

**Points à montrer :**

- Sélecteur de magasin en haut à droite (si la quincaillerie a plusieurs points de vente)
- Graphique du CA des 7 derniers jours
- Liste des produits les plus vendus
- Alertes stock en rouge — cliquer dessus mène directement à la page Stock

---

## ACTE 2 — Réception d'une livraison fournisseur (5 min)

> "Ce matin, le fournisseur **DANGOTE Ciments** livre 200 sacs de ciment CPJ 42,5
> commandés la semaine dernière."

### 2.1 Consulter la commande en attente

1. Menu → **Fournisseurs** → onglet **Bons de commande**.
2. Retrouver la commande avec le statut **EN ATTENTE** (badge orange).
3. **Point à souligner :** la référence de commande est unique et horodatée.

### 2.2 Réceptionner la marchandise

1. Cliquer **Réceptionner la marchandise** (bouton vert sous la commande).
2. La fenêtre de réception s'ouvre : elle affiche chaque article commandé avec sa quantité.
3. Vérifier la quantité physiquement reçue — ici 200 sacs confirmés.
4. Cliquer **Confirmer la réception**.

**Ce qui se passe automatiquement :**

- Le stock de "Ciment CPJ 42,5" passe à **200 sacs**.
- Un mouvement de stock **ENTRÉE** est enregistré avec la date et l'heure.
- La commande passe au statut **RÉCEPTIONNÉ**.
- L'alerte stock sur ce produit disparaît du tableau de bord.

---

## ACTE 3 — Vente au comptoir (caisse POS) (8 min)

> "Premier client de la matinée : M. Koné vient acheter des matériaux pour
> construire sa clôture."

### 3.1 Ouvrir la caisse

1. Menu → **Caisse**.
2. La page POS s'affiche : barre de recherche produit à gauche, panier à droite.

### 3.2 Construire le panier

| Article          | Quantité | Prix unitaire |
| ---------------- | -------- | ------------- |
| Ciment CPJ 42,5  | 10 sacs  | 7 500 FCFA    |
| Fer à béton 10mm | 5 barres | 4 200 FCFA    |
| Gravier 15/25    | 2 m³     | 22 000 FCFA   |

**Pour chaque article :**

1. Taper le nom dans la barre de recherche → les produits s'affichent instantanément.
2. Cliquer sur le produit → il s'ajoute au panier.
3. Ajuster la quantité avec **+** / **−**.

**Point à souligner :** la recherche fonctionne par nom ET par référence, pratique pour les caissiers qui connaissent les codes produits.

### 3.3 Appliquer une remise

- Sur le Ciment : cliquer l'icône remise → saisir **500 FCFA** de remise (fidélité).
- Le sous-total se recalcule en temps réel.

### 3.4 Associer le client

1. Cliquer **Ajouter un client** → chercher "Koné".
2. Sélectionner **M. Koné Amadou** dans la liste.
3. **Point à souligner :** le solde de crédit éventuel est affiché immédiatement.

### 3.5 Encaisser

1. Cliquer **Encaisser**.
2. Choisir le mode de paiement : **Espèces**.
3. Saisir le montant reçu → l'application calcule la monnaie à rendre.
4. Cliquer **Valider la vente**.

**Ce qui se passe automatiquement :**

- Le stock de chaque article est décrémenté.
- Un reçu numérique est généré (numéro de ticket unique).
- La vente apparaît dans l'historique des ventes.

### 3.6 Télécharger le reçu PDF

1. Menu → **Ventes** → retrouver la vente de M. Koné.
2. Cliquer **Reçu PDF** → le document se télécharge.
3. **Point à souligner :** le reçu porte le logo de la boutique, les coordonnées, le numéro de ticket, et le détail des articles.

---

## ACTE 4 — Vente à crédit (3 min)

> "Deuxième client : Mme Traoré est une cliente habituelle. Elle prend
> 50 sacs de ciment mais ne peut payer qu'à moitié aujourd'hui."

### 4.1 Vente avec paiement partiel

1. Caisse → constituer le panier (50 sacs de ciment = 375 000 FCFA).
2. Associer la cliente **Mme Traoré**.
3. Mode de paiement → **Crédit client**.
4. Montant payé : **200 000 FCFA** → reste dû : **175 000 FCFA**.
5. Valider.

**Ce qui se passe :**

- La vente a le statut **CRÉDIT EN COURS**.
- Le solde de Mme Traoré passe à **175 000 FCFA**.
- Ce montant apparaît dans les créances du tableau de bord.

---

## ACTE 5 — Encaissement d'une dette client (3 min)

> "Dans l'après-midi, Mme Traoré revient payer une partie de sa dette."

1. Menu → **Clients** → rechercher "Traoré".
2. Sur la fiche de Mme Traoré, cliquer l'icône **paiement** (carte bancaire).
3. Saisir : montant **100 000 FCFA**, mode **Orange Money**.
4. Valider.

**Ce qui se passe :**

- Le solde passe de 175 000 à **75 000 FCFA**.
- Le paiement est enregistré dans l'historique client.
- Le tableau de bord met à jour les créances totales.

---

## ACTE 6 — Gestion du stock (3 min)

> "Le gérant veut vérifier l'état du stock et corriger une erreur de comptage."

### 6.1 Consulter le stock

1. Menu → **Stock** → onglet **Stocks**.
2. La liste affiche tous les produits avec leur quantité disponible par magasin.
3. **Point à souligner :** les produits sous le seuil minimum sont en surbrillance (onglet Alertes avec badge rouge).

### 6.2 Mouvements de stock

1. Onglet **Mouvements** → historique complet : entrées, sorties, ajustements, transferts.
2. Chaque ligne indique le produit, la quantité, le motif et l'heure.

### 6.3 Ajustement de stock

1. Cliquer **Ajustement**.
2. Saisir le produit, la nouvelle quantité corrigée, et un motif ("Comptage physique").
3. Valider → le mouvement AJUSTEMENT est tracé, irréversible, auditable.

---

## ACTE 7 — Rapports de fin de journée (5 min)

> "En fin de journée, le propriétaire veut voir les chiffres."

### 7.1 Rapport des ventes

1. Menu → **Rapports** → onglet **Ventes**.
2. Période : **Aujourd'hui** (dates pré-remplies).

**Indicateurs affichés :**

- Chiffre d'affaires total
- Nombre de ventes
- Panier moyen
- Graphique des ventes par heure / jour
- Répartition par mode de paiement (Espèces, Orange Money, Wave…)

### 7.2 Rapport de trésorerie

1. Onglet **Trésorerie**.
2. Affiche : encaissements, coût des achats, **marge brute** et **pourcentage de marge**.
3. **Point à souligner :** la marge est calculée automatiquement depuis les prix d'achat saisis sur chaque produit.

### 7.3 Rapport des dettes

1. Onglet **Dettes**.
2. Liste tous les clients débiteurs avec le montant dû.
3. Total global des créances en rouge.

### 7.4 Export Excel

1. Cliquer **Exporter Excel** en haut à droite.
2. Le fichier se télécharge instantanément.
3. **Point à souligner :** le fichier peut être envoyé par WhatsApp au comptable.

---

## ACTE 8 — Panneau d'administration (optionnel, 5 min)

> Pour montrer la dimension multi-boutiques à un groupement ou un franchiseur.

1. Ouvrir http://localhost:3002 → connexion Super Admin.
2. **Tableau de bord admin :** nombre total de tenants actifs, utilisateurs, ventes du réseau.
3. **Gestion des boutiques :** créer une nouvelle boutique ("COULIBALY & Frères — Abobo"), configurer le plan tarifaire, activer/suspendre.
4. **Gestion des utilisateurs :** voir tous les gérants et caissiers, leur boutique associée, leur rôle.
5. **Journaux d'audit :** chaque action sensible (connexion, modification de prix, suppression) est enregistrée avec l'IP, l'utilisateur et l'heure.

---

## Questions fréquentes et réponses

| Question client                                                         | Réponse                                                                                                                                                                    |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Et si la connexion internet coupe ?"                                   | L'application est une PWA installable. Le mode hors-ligne partiel permet de continuer à consulter les dernières données chargées. La sync reprend dès le retour du réseau. |
| "On peut avoir plusieurs caisses en même temps ?"                       | Oui. Chaque caissier a son propre compte. Les ventes sont enregistrées simultanément et le stock est mis à jour en temps réel.                                             |
| "Les données sont sécurisées ?"                                         | Chaque boutique est isolée (multi-tenant). Les mots de passe sont chiffrés (bcrypt). La session expire automatiquement après 15 minutes d'inactivité.                      |
| "On peut utiliser sur téléphone ?"                                      | Oui, c'est conçu mobile-first. L'application s'adapte à tous les écrans et peut être installée comme une appli sur Android et iPhone.                                      |
| "Les anciens prix de vente sont conservés si on modifie un produit ?"   | Oui. Chaque ligne de vente conserve le prix au moment de la transaction.                                                                                                   |
| "Peut-on gérer plusieurs magasins depuis un seul compte propriétaire ?" | Oui. Le propriétaire voit tous ses magasins, peut basculer entre eux depuis le sélecteur en haut, et les rapports peuvent être consolidés.                                 |

---

## Checklist avant la démo

- [ ] PostgreSQL démarré (`pg_ctl start`)
- [ ] API démarrée sur le port 5000 (`pnpm dev` dans `apps/api`)
- [ ] Frontend web démarré sur le port 5173 (`pnpm dev` dans `apps/web`)
- [ ] Frontend admin démarré sur le port 3002 (`pnpm dev` dans `apps/admin`)
- [ ] Données de démonstration présentes (seedées via `pnpm db:seed`)
- [ ] Navigateur ouvert sur http://localhost:5173 en mode responsive 390px
- [ ] Mode Réseau Chrome réglé sur "Fast 3G" pour simuler les conditions terrain

---

## Commandes de démarrage rapide

```powershell
# 1. Démarrer PostgreSQL (si pas encore démarré)
& "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" start `
  -D "$env:USERPROFILE\postgresql\data" `
  -l "$env:USERPROFILE\postgresql\postgresql.log"

# 2. Depuis la racine du projet
cd "C:\Users\ibrahim.coulibaly\Materiaux Construction\materiaux-construction"

# 3. Démarrer tous les services en parallèle
pnpm dev
```

Les trois serveurs (API, web, admin) démarrent en même temps via Turborepo.
