const winston = require('winston');
const path = require('path');

// Définir les niveaux de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Choisir le niveau de log en fonction de l'environnement
const level = () => {
  return 'debug'; // Toujours afficher tous les logs, même en production
};

// Définir les couleurs pour chaque niveau
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Ajouter les couleurs à Winston
winston.addColors(colors);

// Définir le format des logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Définir les transports (où les logs seront envoyés)
const transports = [
  // Console pour tous les logs
  new winston.transports.Console(),
  
  // Fichier pour les erreurs
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
  }),
  
  // Fichier pour tous les logs
  new winston.transports.File({ 
    filename: path.join(__dirname, '../../logs/all.log') 
  }),
];

// Créer le logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger; 