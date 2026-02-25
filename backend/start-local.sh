#!/bin/bash

echo "🚀 === DÉMARRAGE BACKEND MIRACLE CRM ==="
echo "📁 Dossier: $(pwd)"
echo "⏰ Date: $(date)"
echo ""

# Exporter les variables d'environnement locales
export NODE_ENV=development
export PORT=8888
export API_URL=http://localhost:8888

echo "🔧 Variables d'environnement définies:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   API_URL: $API_URL"
echo ""

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo "✅ Dépendances installées"
else
    echo "✅ Dépendances déjà installées"
fi

echo ""
echo "🔥 Démarrage du serveur backend..."
echo "📍 URL: http://localhost:$PORT"
echo "📊 Logs en temps réel:"
echo ""

# Démarrer le serveur avec logs détaillés
npm start 