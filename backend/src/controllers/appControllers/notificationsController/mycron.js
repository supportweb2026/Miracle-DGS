const cron = require('node-cron');
const { notifyExpiringContracts, notifyExpiredInvoices } = require('./index'); 

// Exécution à minuit (UTC+1, heure du Gabon)
// '0 23 * * *' = 23:00 UTC = minuit au Gabon
cron.schedule('0 23 * * *', () => {
  console.log('=== DÉBUT VÉRIFICATION QUOTIDIENNE ===');
  console.log('Date:', new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Libreville' }));
  
  console.log('Vérification des contrats expirés...');
  notifyExpiringContracts();
  
  console.log('Vérification des factures expirées...');
  notifyExpiredInvoices();
  
  console.log('=== FIN VÉRIFICATION QUOTIDIENNE ===');
});
