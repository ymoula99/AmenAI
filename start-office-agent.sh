#!/bin/bash

echo "🚀 Lancement de l'application Agent Immo Bureaux..."
echo ""

cd "$(dirname "$0")/office-agent"

if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances..."
  npm install
  echo ""
fi

echo "✨ Démarrage du serveur de développement..."
echo "➡️  L'application sera disponible sur http://localhost:5173"
echo ""

npm run dev
