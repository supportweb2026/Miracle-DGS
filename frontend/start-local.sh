#!/bin/bash

echo "⚛️ === DÉMARRAGE FRONTEND MIRACLE CRM ==="
echo "📁 Dossier: $(pwd)"
echo "⏰ Date: $(date)"
echo ""

# Exporter les variables d'environnement locales
export VITE_API_URL=http://localhost:8888
export VITE_DEV_MODE=true
export NODE_ENV=development

echo "🔧 Variables d'environnement définies:"
echo "   VITE_API_URL: $VITE_API_URL"
echo "   VITE_DEV_MODE: $VITE_DEV_MODE"
echo "   NODE_ENV: $NODE_ENV"
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
echo "🌐 Démarrage du serveur de développement frontend..."
echo "📍 URL: http://localhost:3000"
echo "📊 Logs en temps réel:"
echo ""

# Démarrer le serveur de développement
npm run dev 