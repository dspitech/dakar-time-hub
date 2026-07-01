## Contexte

Le projet actuel est composé de deux parties :
- **Backend Node/Express** (`keyserver/server.js`) déployé sur Azure Container Apps avec Key Vault, Blob Storage, Table Storage.
- **Frontend statique** (`keyserver/public/index.html` + `app.js` + `style.css`) — une seule page HTML monolithique.

Vous demandez de :
1. Ne pas toucher à la logique métier ni à la configuration Azure existante.
2. Migrer le frontend en **React** avec routing multi-pages.
3. Ajouter **Cosmos DB** côté Azure/Terraform + backend.
4. Ajouter export JSON/CSV, motif de demande de téléchargement, streaming HLS immédiat, cloisonnement strict admin/user.

Avant d'implémenter, je dois clarifier plusieurs points car le périmètre est très large et certaines demandes impactent la logique serveur (ce que vous avez explicitement interdit de modifier).

---

## Plan proposé

### 1. Migration Frontend HTML → React (Vite + TS + Tailwind + shadcn)

Nouvelle app React servie par le même serveur Express (build statique dans `keyserver/public/`), routing via `react-router-dom` :

```text
/                     → Page Présentation (marketing, publique)
/login                → Formulaire connexion seul → redirige /admin ou /user
/register             → Formulaire inscription seul → redirige /admin ou /user
/admin                → Dashboard Admin (sidebar) — rôle admin uniquement
  /admin/library         Bibliothèque + lecteur
  /admin/upload          Upload vidéo
  /admin/videos          Gestion CRUD vidéos
  /admin/users           Gestion comptes
  /admin/download-req    Demandes de téléchargement à valider
  /admin/audit           Journal d'audit
/user                 → Dashboard User (sidebar) — rôle user/guest
  /user/library          Bibliothèque + lecteur + commentaires
  /user/my-requests      Mes demandes de téléchargement
```

- Sidebar shadcn collapsible, header avec profil/déconnexion.
- Design system : reprise de la palette actuelle (vert/or/rouge type Sénégal ? ou nouvelle direction — voir question 2).
- Guard de routes côté client + vérification serveur inchangée (les endpoints existants renvoient déjà 401/403).

### 2. Nouvelles fonctionnalités frontend

- **Bouton "Export JSON / CSV"** à côté du bouton Télécharger : exporte les métadonnées de la vidéo (id, titre, propriétaire, dates, durée, nb segments, commentaires, logs associés) sous forme de fichier téléchargeable.
- **Champ "Raison" obligatoire** dans le formulaire de demande de téléchargement.
- **Streaming HLS immédiat** : le lecteur commence la lecture dès le premier segment (`hls.js` avec `lowLatencyMode` + `startPosition: 0` + `autoStartLoad: true`). Les segments suivants se chargent en arrière-plan pendant la lecture.
- **Cloisonnement strict** : les routes `/admin/*` ne sont même pas montées pour un user ; la sidebar user n'affiche que ses sections.

### 3. Ajout Cosmos DB (Terraform + backend)

Ajout dans `terraform/main.tf` d'un compte **Azure Cosmos DB (API SQL, serverless)** avec une base `zerotrust` et les containers :

| Container            | Partition key   | Contenu                                          |
|----------------------|-----------------|--------------------------------------------------|
| `users`              | `/username`     | comptes + rôle + hash bcrypt                     |
| `videos`             | `/id`           | métadonnées vidéo (titre, propriétaire, dates)   |
| `video_logs`         | `/videoId`      | événements par vidéo (upload, lecture, delete)   |
| `comments`           | `/videoId`      | commentaires horodatés                           |
| `download_requests`  | `/videoId`      | demandes + raison + statut                       |
| `auth_events`        | `/username`     | connexions, inscriptions, déconnexions           |
| `audit`              | `/day`          | audit global (délivrances clé, CRUD, rotations)  |

Côté `keyserver/server.js` : ajout du SDK `@azure/cosmos` et d'une couche `db/cosmos.js` qui remplace progressivement les appels Table Storage. **Important :** cela touche la logique de persistance — voir question 1.

### 4. Fichiers créés / modifiés (aperçu)

- `keyserver/package.json` : ajout `@azure/cosmos`, scripts build React.
- `keyserver/frontend/` (nouveau) : projet Vite React (src/pages, src/components, src/lib/api.ts, src/hooks/useAuth.ts…).
- `keyserver/public/` : remplacé par le build React.
- `keyserver/db/cosmos.js` (nouveau).
- `keyserver/server.js` : ajout endpoints `/videos/:id/export?format=json|csv`, ajout champ `reason` dans `/download-requests`, branchement Cosmos.
- `terraform/main.tf` + `variables.tf` + `outputs.tf` : ressource `azurerm_cosmosdb_account` + containers + injection connection string dans Container App.

---

## Questions bloquantes avant implémentation

Je vais vous poser ces questions dans le prochain message — merci d'y répondre avant que je code :

1. **Cosmos DB vs Table Storage** — Le backend utilise aujourd'hui Azure Table Storage pour users/videos/comments/audit. Ajouter Cosmos DB **remplace-t-il** Table Storage (migration complète, refonte des accès), ou Cosmos vient-il **en plus** (double persistance / seulement pour les nouvelles entités logs) ? La 1re option modifie la logique du serveur, la 2e la préserve.
2. **Direction visuelle du dashboard** — On garde la palette actuelle (vert/or Sénégal foncé) ou on part sur un style dashboard SaaS pro plus neutre (slate/indigo, style Linear/Vercel) ?
3. **Structure du repo React** — Je crée le projet React **dans** `keyserver/frontend/` (buildé vers `keyserver/public/`) ou à la racine dans un nouveau dossier `web/` ? Le premier garde tout dans le container existant, le second sépare mieux.
4. **Rôle "invité"** — L'invité conserve-t-il l'accès au dashboard user (comme aujourd'hui), ou a-t-il une page dédiée en lecture seule ?

Répondez et je lance l'implémentation.
