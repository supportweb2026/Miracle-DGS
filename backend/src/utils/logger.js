const winston = require('winston');

// Configuration simple pour afficher dans la console
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// En production, on garde le niveau info pour voir les erreurs
if (process.env.NODE_ENV === 'production') {
  logger.level = 'info';
}

module.exports = logger; 