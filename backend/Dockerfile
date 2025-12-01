# Utiliser l'image Node.js LTS
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install
 
# Copier le reste du code
COPY . .

# Créer le dossier uploads
RUN mkdir -p /app/uploads

# Exposer le port
EXPOSE 5000

# Démarrer l'application
CMD ["node", "app.js"]