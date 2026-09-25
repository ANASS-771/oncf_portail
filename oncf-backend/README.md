# Backend mock — ONCF Portal (pour tester le frontend)

Ceci est un backend **Express** léger avec des données fictives en mémoire,
qui implémente tous les endpoints attendus par `src/api/client.ts` du frontend
(auth par cookie JWT, stock, sorties, factures, réclamations, simulateur, admin...).

Aucune base de données n'est nécessaire : les données (clients, conteneurs,
sorties, factures, réclamations...) sont générées aléatoirement au démarrage
mais restent cohérentes entre elles pendant toute la durée de vie du process.

## Installation & lancement

```bash
cd oncf-backend
npm install
npm start
```

Le serveur écoute sur **http://localhost:5271**, exactement le port attendu
par le proxy Vite du frontend (`vite.config.ts` → `/api` → `localhost:5271`).

Lancez ensuite le frontend normalement dans un autre terminal :

```bash
cd oncf-portal
npm install   # si pas déjà fait
npm run dev
```

Puis ouvrez http://localhost:5173.

## Comptes de test

| Login     | Mot de passe | Rôle   | Détails                          |
|-----------|--------------|--------|-----------------------------------|
| admin     | admin123     | ADMIN  | Accès admin (clients, users, sync)|
| agent     | agent123     | AGENT  | Vue globale des réclamations       |
| maer001   | client123    | CLIENT | Maersk Morocco                     |
| cmacgm1   | client123    | CLIENT | CMA CGM Maroc                      |
| transm1   | client123    | CLIENT | Transimex SARL                     |
| atlas01   | client123    | CLIENT | Atlas Import Export                |
| nouveau   | temp123      | CLIENT | Doit changer son mot de passe (teste `/change-password`) |

## Ce qui est simulé

- Auth par cookie httpOnly JWT (comme attendu par `axios` avec `withCredentials: true`)
- ~40 conteneurs par client (stock, sorties, alertes)
- Factures + lignes de facture + PDF factices téléchargeables
- Réclamations avec historique d'audit
- Simulateur de facturation (douane et hors douane)
- Endpoints admin : gestion clients/utilisateurs, statut de synchro, journal, stats

## Limites (c'est un mock, pas le vrai backend)

- Données en mémoire : tout est réinitialisé si vous relancez le serveur.
- Les PDF générés (`/documents/*`, `/factures/:id/pdf`, simulateur) sont des
  PDF minimalistes juste pour tester le téléchargement, pas de vraie mise en page.
- Pas de vraie logique de tarification, les montants du simulateur sont approximatifs.
