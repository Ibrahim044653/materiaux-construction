"""Tests de securite dynamiques contre l'API BoutikPro.

Les identifiants viennent de l'environnement, jamais du code :

    $env:BOUTIKPRO_API      = "https://boutikpro.vercel.app"
    $env:BOUTIKPRO_WEB      = "https://boutikpro-web.vercel.app"
    $env:BOUTIKPRO_OWNER    = "proprietaire@demo.com:motdepasse"
    $env:BOUTIKPRO_CASHIER  = "caissier@demo.com:motdepasse"
    python scripts/security-test.py

Lecture seule : aucun test ne modifie de donnee. Le test de limitation de
debit est volontairement absent, il bloquerait l'adresse IP 30 minutes.
"""

import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request

API = os.environ.get("BOUTIKPRO_API", "https://boutikpro.vercel.app")
WEB = os.environ.get("BOUTIKPRO_WEB", "https://boutikpro-web.vercel.app")
V1 = API + "/api/v1"
CTX = ssl.create_default_context()


def creds(var):
    valeur = os.environ.get(var)
    if not valeur or ":" not in valeur:
        sys.exit("Variable %s absente ou mal formee (attendu email:motdepasse)" % var)
    return valeur.split(":", 1)


resultats = []


def req(method, url, token=None, body=None, origin=None, raw_auth=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    if data:
        r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    if raw_auth:
        r.add_header("Authorization", raw_auth)
    if origin:
        r.add_header("Origin", origin)
    try:
        with urllib.request.urlopen(r, timeout=30, context=CTX) as resp:
            return resp.status, resp.read(200000), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(20000), dict(e.headers)
    except Exception as e:  # noqa: BLE001
        return 0, str(e).encode(), {}


def login(email, mdp):
    code, body, _ = req("POST", V1 + "/auth/login", body={"email": email, "password": mdp})
    if code != 200:
        sys.exit("Connexion impossible pour %s (HTTP %s)" % (email, code))
    d = json.loads(body)["data"]
    return d["accessToken"], d["user"]


def check(nom, attendu, obtenu, detail=""):
    ok = attendu(obtenu) if callable(attendu) else obtenu == attendu
    resultats.append((ok, nom, str(obtenu), detail))


def main():
    tok_owner, u_owner = login(*creds("BOUTIKPRO_OWNER"))
    tok_cash, u_cash = login(*creds("BOUTIKPRO_CASHIER"))

    # -- Authentification ---------------------------------------------------
    check("Route protegee sans jeton refusee", 401, req("GET", V1 + "/stores")[0])
    check("Jeton malforme refuse", 401,
          req("GET", V1 + "/stores", raw_auth="Bearer ceci.nest.pas.un.jwt")[0])
    altere = tok_owner[:-6] + ("aaaaaa" if not tok_owner.endswith("aaaaaa") else "bbbbbb")
    check("Signature JWT alteree refusee", 401, req("GET", V1 + "/stores", token=altere)[0])
    check("Schema non-Bearer refuse", 401,
          req("GET", V1 + "/stores", raw_auth="Basic " + tok_owner)[0])

    # -- Roles --------------------------------------------------------------
    check("Caissier ne cree pas de magasin", 403,
          req("POST", V1 + "/stores", token=tok_cash, body={"name": "X"})[0])
    check("Caissier ne cree pas d'utilisateur", 403,
          req("POST", V1 + "/users", token=tok_cash,
              body={"email": "x@y.ci", "name": "X", "role": "OWNER", "password": "Azerty123"})[0])
    check("Caissier ne cree pas de categorie", 403,
          req("POST", V1 + "/categories", token=tok_cash, body={"name": "X"})[0])
    check("Caissier ne peut pas s'auto-promouvoir", 403,
          req("PATCH", V1 + "/users/" + u_cash["id"], token=tok_cash, body={"role": "OWNER"})[0])

    # -- Cloisonnement multi-boutique ---------------------------------------
    check("Identifiant etranger -> 404", 404,
          req("GET", V1 + "/stores/identifiant-dune-autre-boutique", token=tok_owner)[0])
    code, body, _ = req("GET", V1 + "/users", token=tok_owner)
    if code == 200:
        users = json.loads(body)["data"]
        check("Utilisateurs limites a la boutique", True,
              all(u.get("tenantId") in (None, u_owner["tenantId"]) for u in users),
              "%d utilisateurs" % len(users))

    # -- Injection ----------------------------------------------------------
    for charge in ["' OR '1'='1", "'; DROP TABLE products;--", "%27%20OR%201=1"]:
        code, _, _ = req("GET", V1 + "/customers?q=" + urllib.parse.quote(charge), token=tok_owner)
        check("Injection neutralisee : %s" % charge[:18], lambda c: c in (200, 400), code,
              "HTTP %s" % code)

    # -- Politique de mot de passe ------------------------------------------
    for faible, libelle in [("azerty", "trop court"),
                            ("azertyuiop", "sans majuscule ni chiffre"),
                            ("Azertyuiop", "sans chiffre")]:
        code, _, _ = req("POST", V1 + "/auth/register", body={
            "shopName": "Test", "ownerName": "Test",
            "email": "sectest-%d@exemple.ci" % abs(hash(faible)), "password": faible})
        check("Mot de passe %s refuse" % libelle, lambda c: c in (400, 422), code, "HTTP %s" % code)

    # -- CORS ---------------------------------------------------------------
    _, _, h = req("GET", API + "/health", origin="https://attaquant.example")
    check("Origine inconnue sans en-tete permissif", True,
          not h.get("Access-Control-Allow-Origin"),
          "ACAO=%r" % h.get("Access-Control-Allow-Origin"))
    _, _, h = req("GET", API + "/health", origin=WEB)
    check("Origine du front autorisee", WEB, h.get("Access-Control-Allow-Origin"))

    # -- En-tetes de securite -----------------------------------------------
    _, _, h = req("GET", API + "/health")
    entetes = {k.lower(): v for k, v in h.items()}
    for nom, cle in [("HSTS", "strict-transport-security"),
                     ("X-Content-Type-Options", "x-content-type-options"),
                     ("X-Frame-Options", "x-frame-options"),
                     ("Content-Security-Policy", "content-security-policy")]:
        check("En-tete %s present" % nom, True, cle in entetes, entetes.get(cle, "absent")[:50])
    check("X-Powered-By masque", True, "x-powered-by" not in entetes)

    # -- Divulgation d'information ------------------------------------------
    _, body, _ = req("POST", V1 + "/auth/login",
                     body={"email": "inexistant@nulle-part.ci", "password": "Peu importe 1"})
    msg = json.loads(body).get("message", "")
    check("Message de connexion non discriminant", True, "incorrect" in msg.lower(), msg)
    _, body, _ = req("GET", V1 + "/route-inexistante", token=tok_owner)
    check("404 sans trace de pile", True, b"at " not in body and b".ts:" not in body)
    _, body, _ = req("GET", API + "/health")
    check("/health ne divulgue pas la base", True,
          b"postgres" not in body.lower(), body[:70].decode(errors="replace"))

    largeur = max(len(n) for _, n, _, _ in resultats)
    echecs = 0
    for ok, nom, obtenu, detail in resultats:
        if not ok:
            echecs += 1
        print("%s %-*s  %s" % ("OK  " if ok else "KO  ", largeur, nom, detail or obtenu))
    print("\n%d tests, %d succes, %d echecs" % (len(resultats), len(resultats) - echecs, echecs))
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
