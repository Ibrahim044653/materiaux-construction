"""Mesures de performance : latence de l'API et poids du front.

    $env:BOUTIKPRO_API   = "https://boutikpro.vercel.app"
    $env:BOUTIKPRO_WEB   = "https://boutikpro-web.vercel.app"
    $env:BOUTIKPRO_OWNER = "proprietaire@demo.com:motdepasse"
    python scripts/perf-test.py

Le premier appel est mesure a part : il porte le demarrage a froid de la
fonction serverless, qui n'est pas representatif du regime courant.
"""

import json
import os
import re
import ssl
import statistics
import sys
import time
import urllib.error
import urllib.request

API = os.environ.get("BOUTIKPRO_API", "https://boutikpro.vercel.app")
WEB = os.environ.get("BOUTIKPRO_WEB", "https://boutikpro-web.vercel.app")
V1 = API + "/api/v1"
CTX = ssl.create_default_context()
TOURS = int(os.environ.get("BOUTIKPRO_TOURS", "8"))


def appel(url, token=None, body=None, methode="GET"):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=methode)
    if data:
        r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    r.add_header("Accept-Encoding", "gzip, br")
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(r, timeout=40, context=CTX) as resp:
            contenu = resp.read()
            return (time.perf_counter() - t0) * 1000, resp.status, len(contenu), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return (time.perf_counter() - t0) * 1000, e.code, len(e.read()), dict(e.headers)
    except Exception as e:  # noqa: BLE001
        return 0.0, 0, 0, {"erreur": str(e)}


def mesurer(nom, url, token=None, tours=TOURS):
    mesures, code, taille = [], None, 0
    for _ in range(tours):
        ms, code, taille, _ = appel(url, token=token)
        mesures.append(ms)
    mesures.sort()
    p95 = mesures[min(len(mesures) - 1, int(len(mesures) * 0.95))]
    print("%-28s n=%-3d min %6.0f  p50 %6.0f  p95 %6.0f  max %6.0f ms  %6.1f Ko  HTTP %s"
          % (nom, len(mesures), mesures[0], statistics.median(mesures), p95, mesures[-1],
             taille / 1024, code))


def main():
    id_mdp = os.environ.get("BOUTIKPRO_OWNER")
    if not id_mdp or ":" not in id_mdp:
        sys.exit("Variable BOUTIKPRO_OWNER absente (attendu email:motdepasse)")
    email, mdp = id_mdp.split(":", 1)

    print("=== API : latence ===\n")
    froid, code, _, _ = appel(API + "/health")
    print("%-28s %6.0f ms  HTTP %s  (demarrage a froid)" % ("GET /health", froid, code))
    mesurer("GET /health (a chaud)", API + "/health", tours=15)

    mesures = []
    for _ in range(min(TOURS, 6)):
        ms, code, _, _ = appel(V1 + "/auth/login", methode="POST",
                               body={"email": email, "password": mdp})
        mesures.append(ms)
    mesures.sort()
    print("%-28s n=%-3d min %6.0f  p50 %6.0f  max %6.0f ms  HTTP %s  (bcrypt 12 tours)"
          % ("POST /auth/login", len(mesures), mesures[0], statistics.median(mesures),
             mesures[-1], code))

    _, _, _, _ = appel(V1 + "/auth/login", methode="POST", body={"email": email, "password": mdp})
    r = urllib.request.Request(V1 + "/auth/login",
                               data=json.dumps({"email": email, "password": mdp}).encode(),
                               method="POST")
    r.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(r, timeout=40, context=CTX) as resp:
        token = json.load(resp)["data"]["accessToken"]

    for chemin in ["/stores", "/users", "/customers", "/dashboard/kpis",
                   "/categories", "/products"]:
        mesurer("GET " + chemin, V1 + chemin, token=token)

    print("\n=== Front : poids du chemin critique ===\n")
    ms, code, taille, h = appel(WEB + "/")
    print("%-28s %6.0f ms  %6.1f Ko  HTTP %s  %s"
          % ("index.html", ms, taille / 1024, code, h.get("Content-Encoding", "non compresse")))
    if code != 200:
        print("Front indisponible, mesures interrompues.")
        return 1

    with urllib.request.urlopen(WEB + "/", timeout=30, context=CTX) as resp:
        html = resp.read().decode("utf-8", "replace")
    total = taille
    for ref in sorted(set(re.findall(r'(?:src|href)="(/assets/[^"]+)"', html))):
        ms, code, taille, h = appel(WEB + ref)
        total += taille
        print("%-28s %6.0f ms  %6.1f Ko  %s"
              % (ref.split("/")[-1][:28], ms, taille / 1024, h.get("Content-Encoding", "brut")))
    print("%-28s %15.1f Ko  (transfere, compression comprise)" % ("TOTAL", total / 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
