const mongoose = require('mongoose');
const Contract = require('../../../models/appModels/Contract');
const Counter = require('../../../models/appModels/Counter');
const Setting = require('../../../models/coreModels/Setting');
const Prestation = require('../../../models/appModels/Prestation');
const SiteTariff = require('../../../models/appModels/SiteTariff');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Fonction pour sauvegarder les logs dans un fichier .txt (comme invoicePuppeteerController)
const saveLogsToFile = (logs, contractId) => {
    try {
        const logsDir = path.join(__dirname, '../../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const logFileName = `contract_debug_logs_${contractId || 'unknown'}_${timestamp}.txt`;
        const logFilePath = path.join(logsDir, logFileName);
        
        fs.writeFileSync(logFilePath, logs, 'utf8');
        console.log(`📁 Logs de debug sauvegardés dans: ${path.resolve(logFilePath)}`);
        return logFilePath;
    } catch (error) {
        console.error('❌ Erreur sauvegarde logs:', error.message);
        return null;
    }
};

// Variable pour accumuler les logs
let debugLogs = '';

exports.create = async (req, res) => {
  // Réinitialiser les logs pour cette requête
  debugLogs = '';
  
  try {
    debugLogs += `=== DÉBUT CRÉATION CONTRAT ===\n`;
    debugLogs += `Timestamp: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`;
    debugLogs += `Données reçues: ${JSON.stringify(req.body, null, 2)}\n\n`;
    
    const { services, number, year } = req.body;
    
    // Vérifier si le numéro de contrat existe déjà pour cette année
    const currentYear = year || new Date().getFullYear();
    debugLogs += `Vérification doublon - Numéro: ${number}, Année: ${currentYear}\n`;
    
    const existingContract = await Contract.findOne({ 
      number: number, 
      year: currentYear,
      removed: false 
    });
    
    debugLogs += `Contrat existant trouvé: ${existingContract ? 'OUI' : 'NON'}\n`;
    if (existingContract) {
      debugLogs += `Détails du contrat existant:\n${JSON.stringify({
        _id: existingContract._id,
        number: existingContract.number,
        year: existingContract.year,
        removed: existingContract.removed
      }, null, 2)}\n`;
    }
    
    if (existingContract) {
      debugLogs += `❌ ERREUR: Contrat numéro ${number}/${currentYear} existe déjà - CRÉATION BLOQUÉE\n`;
      debugLogs += `=== FIN CRÉATION CONTRAT (BLOQUÉE) ===\n`;
      
      // Sauvegarder les logs
      saveLogsToFile(debugLogs, 'blocked_' + number);
      
      return res.status(400).json({
        success: false,
        message: `Un contrat avec le numéro ${number}/${currentYear} existe déjà. Veuillez choisir un autre numéro.`
      });
    }
    
    debugLogs += `✅ Aucun doublon trouvé - Création autorisée\n`;
    
    // Traiter les services pour gérer les deux types de prestations
    let processedServices = [];
    
    if (services && Array.isArray(services)) {
      processedServices = await Promise.all(services.map(async (service) => {
        const processedService = { ...service };
        
        if (service.prestationType === 'classic') {
          // Prestation classique : récupérer les informations de base
          const prestation = await Prestation.findById(service.prestationId);
          if (!prestation) {
            throw new Error(`Prestation classique non trouvée: ${service.prestationId}`);
          }
          
          processedService.dailyRate = prestation.baseDailyRate;
          processedService.hourlyRate = prestation.baseHourlyRate;
          processedService.duration = prestation.baseDuration;
          
        } else if (service.prestationType === 'site_specific') {
          // Prestation spécifique au site : récupérer les informations du SiteTariff
          const siteTariff = await SiteTariff.findById(service.siteTariffId);
          if (!siteTariff) {
            throw new Error(`SiteTariff non trouvé: ${service.siteTariffId}`);
          }
          
          if (siteTariff.useCustomValues) {
            processedService.dailyRate = siteTariff.customDailyRate;
            processedService.hourlyRate = siteTariff.customHourlyRate;
            processedService.duration = siteTariff.customDuration;
          } else {
            processedService.dailyRate = siteTariff.prestation.baseDailyRate;
            processedService.hourlyRate = siteTariff.prestation.baseHourlyRate;
            processedService.duration = siteTariff.prestation.baseDuration;
          }
        }
        
        return processedService;
      }));
    }

    // Créer le nouveau contrat avec les services traités
    const contractData = {
      ...req.body,
      services: processedServices
    };

    debugLogs += `Données du contrat à créer:\n${JSON.stringify(contractData, null, 2)}\n\n`;

    const contract = await Contract.create(contractData);

    // Mettre à jour last_contract_number dans les settings avec le numéro du contrat créé
    await Setting.findOneAndUpdate(
      { settingKey: 'last_contract_number' },
      { $set: { settingValue: contract.number } },
      { new: true }
    );

    debugLogs += `✅ Contrat créé avec succès - ID: ${contract._id}, Numéro: ${contract.number}\n`;
    debugLogs += `=== FIN CRÉATION CONTRAT ===\n`;
    
    // Sauvegarder les logs
    saveLogsToFile(debugLogs, contract._id);

    return res.status(201).json({
      success: true,
      result: contract,
      message: 'Contrat créé avec succès'
    });
  } catch (error) {
    debugLogs += `❌ ERREUR lors de la création du contrat: ${error.message}\n`;
    debugLogs += `Stack trace: ${error.stack}\n`;
    debugLogs += `=== FIN CRÉATION CONTRAT (ERREUR) ===\n`;
    
    // Sauvegarder les logs d'erreur
    saveLogsToFile(debugLogs, 'error');
    
    console.error('❌ Erreur lors de la création du contrat:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création du contrat',
      error: error.message
    });
  }
};
