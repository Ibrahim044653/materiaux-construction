# BoutikPro — application web

Front React + Vite, déployé sur Vercel dans le projet `boutikpro-web`.

## Déploiement

Le projet est connecté à GitHub et se reconstruit à chaque push sur `master`.
Deux réglages conditionnent un build correct ; les perdre casse le site sans
que le déploiement ne signale d'erreur.

**Root Directory = `apps/web`**

Sans ce réglage, Vercel lit le `vercel.json` de la racine, qui décrit l'API.
Le build produit alors une fonction serverless au lieu d'un site statique, et
toutes les pages renvoient 404.

**`VITE_API_URL` doit être une variable d'environnement non sensible**

Vite remplace `import.meta.env.VITE_API_URL` au moment de la compilation. Une
variable marquée _Sensitive_ dans Vercel n'est pas exposée au build : la valeur
devient vide, le front appelle sa propre origine et la connexion échoue
silencieusement — l'écran s'affiche normalement mais aucun appel n'aboutit.

```bash
vercel env add VITE_API_URL production --no-sensitive --value "https://boutikpro.vercel.app"
```

Pour vérifier qu'un déploiement est sain, l'URL de l'API doit apparaître
dans le bundle servi :

```bash
curl -s https://boutikpro-web.vercel.app/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js'
curl -s https://boutikpro-web.vercel.app/assets/index-XXXX.js | grep -c 'boutikpro.vercel.app'
```

Un build n'est declenché que si des fichiers sous `apps/web` changent. Pour
forcer une reconstruction après une modification de variable d'environnement,
toucher un fichier de ce dossier ou relancer le build depuis le tableau de bord.

## CORS

L'API n'accepte que les origines listées dans `FRONTEND_URL`, `ADMIN_URL` et
`CORS_EXTRA_ORIGINS`. Toute nouvelle URL de front doit y être ajoutée, sinon le
navigateur bloque les appels.

## Développement local

```bash
pnpm install
pnpm --filter @boutikpro/shared build   # le front importe des types du paquet partagé
pnpm --filter @boutikpro/web dev        # http://localhost:5173
```

En local, `VITE_API_URL` peut rester vide : Vite proxifie `/api` vers
`http://localhost:3001` (voir `vite.config.ts`).
