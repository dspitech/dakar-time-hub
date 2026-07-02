# Transformation React JS Vite

Ce projet conserve le backend Node/Express et la logique métier existante. Le frontend statique HTML/JS a été remplacé par une application React JS Vite.

## Installation

```bash
cd keyserver
npm install
```

## Développement React

Lancez le serveur API Node dans un terminal :

```bash
npm start
```

Puis le frontend Vite dans un autre terminal :

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

Le backend sert automatiquement le dossier `dist/` généré par Vite.

## Cosmos DB

Au démarrage, le serveur crée désormais aussi les tables suivantes :

- `ViewingLogs`
- `VideoSegments`
- `RetentionScores`

## Correction téléchargement

L'erreur Cosmos DB `PropertyNameInvalid: odata.metadata` est corrigée : les métadonnées système Azure Table sont retirées avant `updateEntity` lors de l'approbation/refus d'une demande.

## Lecture vidéo

La vidéo se lance lorsque l'utilisateur clique sur **Démarrer la lecture**. Le lecteur demande un `key-token`, configure HLS.js, puis lance la lecture.
