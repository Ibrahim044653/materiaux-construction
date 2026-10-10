# État du projet — 10 octobre 2026

## En production

|       | Adresse                                                 | État       |
| ----- | ------------------------------------------------------- | ---------- |
| Front | https://boutikpro-web.vercel.app                        | en ligne   |
| API   | https://boutikpro.vercel.app                            | en ligne   |
| Dépôt | https://github.com/Ibrahim044653/materiaux-construction | **public** |

Projets Vercel : `boutikpro` (API, racine du dépôt) et `boutikpro-web`
(front, Root Directory `apps/web`). Les deux se redéploient à chaque push
sur `master`.

## Ce qui fonctionne

Connexion, inscription autonome, tableau de bord, magasins, utilisateurs,
clients. Quatre routes métier sur six répondent en production.

Sécurité : 26 contrôles passent (`scripts/security-test.py`) —
authentification, rôles, cloisonnement multi-boutique, injection SQL, CORS,
en-têtes, absence de divulgation.

## Le seul point bloquant

**La migration `20261010120000_dynamic_categories` n'est pas appliquée sur la
base de production.** Le code attend la table `categories` et la colonne
`products.categoryId` ; la base a encore l'ancienne énumération.

Conséquence : `GET /api/v1/products` et `GET /api/v1/categories` renvoient 500.
Dans l'application, les écrans Produits, Stock et Caisse sont inutilisables.

Aucun déploiement ne corrige cela : le code est bon, c'est le schéma qui est en
retard. Deux façons d'appliquer la migration :

**En local** — l'URL est saisie à l'exécution, elle ne passe ni par un fichier
ni par l'historique du shell :

```powershell
.\scripts\migrate-prod.ps1
```

**Par GitHub Actions** — créer le secret de dépôt `DATABASE_URL`
(Settings → Secrets and variables → Actions), avec la valeur lue dans
Vercel → boutikpro → Settings → Environment Variables. Le workflow
`.github/workflows/migrate.yml` part alors au prochain push.

Attention au copier-coller : la variable Vercel porte un BOM invisible en
tête. Sélectionner à partir du `p` de `postgresql://`.

La migration crée la table, rattache chaque produit à sa catégorie, puis
supprime l'ancienne colonne. Validée en local sur un schéma identique :
18 produits, aucune perte.

## Points de vigilance

**Le dépôt est public.** Son historique contient les anciens mots de passe de
démonstration — désormais sans valeur, ils ont été changés. Les documents ne
publient plus d'identifiants. Le passer en privé reste souhaitable.

**Latence de l'API** : 700 ms à 1 s par appel pour des réponses de moins de
2 Ko. Chaque requête est une fonction serverless qui rouvre une connexion
Postgres. Le levier le plus rentable est de pointer `DATABASE_URL` sur l'URL
_pooled_ de l'hébergeur de base, avant toute optimisation de code.

**Déploiement du front** : deux réglages le cassent silencieusement s'ils
disparaissent — Root Directory sur `apps/web`, et `VITE_API_URL` en variable
**non sensible**. Détail dans `apps/web/README.md`.

**Non testé** : la limitation de débit sur la connexion. La vérifier bloque
l'adresse IP 30 minutes.

## Documents

| Fichier                        | Pour qui                                          |
| ------------------------------ | ------------------------------------------------- |
| `DEMO_PROSPECT.md`             | un commerçant qui découvre l'application, 3 pages |
| `GUIDE_PRESENTATION_CLIENT.md` | présentation commerciale complète, 13 pages       |
| `DEMO_SCENARIO.md`             | déroulé de démonstration en local                 |
| `apps/web/README.md`           | conditions d'un déploiement correct du front      |

Les PDF se régénèrent avec `scripts/guide-md2html.py` puis une impression via
Edge en mode headless. Ils ne sont pas versionnés : ils portent la mention
confidentiel et le dépôt est public.
