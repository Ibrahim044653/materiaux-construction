# BoutikPro — panneau d'administration

Interface réservée à l'éditeur, séparée de l'application commerçant.
Déployée sur Vercel dans le projet `boutikpro-admin`.

**https://boutikpro-admin.vercel.app**

## À quoi elle sert

Gestion du réseau de boutiques : liste des tenants, création et suspension,
plan tarifaire, utilisateurs de toutes les boutiques, et journaux d'audit
globaux. Elle s'adresse au compte `SUPER_ADMIN`, qui n'est rattaché à aucune
boutique — ce compte ne doit pas être utilisé sur l'application commerçant,
dont l'interface attend un tenant.

## Déploiement

Mêmes contraintes que `apps/web`, et elles cassent le site en silence quand
elles ne sont pas respectées :

- **Root Directory = `apps/admin`**. Sinon Vercel lit le `vercel.json` de la
  racine, qui décrit l'API, construit une fonction serverless au lieu d'un
  site statique, et toutes les pages renvoient 404.
- **`VITE_API_URL` en variable non sensible**. Une variable marquée
  _Sensitive_ n'est pas exposée au build : l'URL devient vide et aucun appel
  n'aboutit. Le `buildCommand` prévoit un repli sur l'API de production.

## CORS

L'origine du panneau doit figurer dans `CORS_EXTRA_ORIGINS` ou `ADMIN_URL`
côté API, sinon toute requête échoue. Attention : une origine non autorisée
produit actuellement une **erreur 500**, pas un 403 — le message de refus du
middleware CORS remonte au gestionnaire d'erreurs générique.

## Développement local

```bash
pnpm --filter @boutikpro/shared build
pnpm --filter @boutikpro/admin dev    # http://localhost:3002
```
