# Backend SUPFile

API REST du projet SUPFile.

## Stack

- Node.js 18
- Express
- MySQL + Sequelize
- JWT pour l'auth
- Multer pour les uploads

## Lancer
npm install
npm start

Le serveur tourne sur le port 5000.

## Avec Docker

docker compose up backend

## Config

Copier `.env.example` vers `.env` et remplir les valeurs :

DB_HOST=db
DB_USER=supfile
DB_PASSWORD=ton_mdp
DB_NAME=supfile
JWT_SECRET=un_secret_random

