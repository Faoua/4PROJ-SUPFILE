# SUPFile

Projet 4PROJ SUPINFO - Application de stockage cloud.

## C'est quoi ?

Une app web pour stocker ses fichiers en ligne, comme Google Drive. Chaque utilisateur a 30 Go d'espace.

## Comment lancer ?

1. Cloner le repo

git clone https://github.com/Faoua/4PROJ-SUPFILE.git
cd 4PROJ-SUPFILE

2. Configurer le backend

cp backend/.env.example backend/.env

3. Lancer avec Docker

docker compose up --build

4. Ouvrir http://localhost:3000

## Stack technique

- Frontend : React + Vite + Tailwind
- Backend : Node.js + Express + Sequelize
- BDD : MySQL
- Conteneurisation : Docker

## Fonctionnalités

- Créer un compte / se connecter (+ Google et GitHub)
- Uploader des fichiers
- Créer des dossiers
- Renommer, déplacer, supprimer
- Prévisualiser (images, PDF, vidéos, texte)
- Partager par lien
- Recherche
- Corbeille

## Auteur

Fadoua Belmokhtar - SUPINFO 2025