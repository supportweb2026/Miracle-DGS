const mongoose = require('mongoose');
const Invoice = mongoose.model('Invoice');
const Contract = mongoose.model('Contract');
const Counter = mongoose.model('Counter');
const SiteTariff = mongoose.model('SiteTariff');
const Setting = mongoose.model('Setting');
const dayjs = require('dayjs');
const schema = require('./schemaValidate');
const logger = require('../../../config/logger');
const Taxes = mongoose.model('Taxes'); // Added missing import

const create = async (req, res) => {
  try {
    logger.info('--- Création facture ---');
    logger.debug('Body reçu:', JSON.stringify(req.body, null, 2));
    
    // Validation avec Joi - DÉSACTIVÉE
    // const { error } = schema.validate(req.body);
    // if (error) {
    //   logger.error('Erreur de validation Joi:', error.details);
    //   return res.status(400).json({
    //     success: false,
    //     message: error.details[0].message
    //   });
    // }
    
    const { services, client, contract, taxRate, number, year } = req.body;
    
    // Vérifier si le numéro de facture existe déjà pour cette année
    const existingInvoice = await Invoice.findOne({ 
      number: number, 
      year: year || new Date().getFullYear(),
      removed: false 
    });
    
    if (existingInvoice) {
      logger.warn(`Erreur: Facture numéro ${number}/${year || new Date().getFullYear()} existe déjà`);
      return res.status(400).json({
        success: false,
        message: `Une facture avec le numéro ${number}/${year || new Date().getFullYear()} existe déjà. Veuillez choisir un autre numéro.`
      });
    }
    logger.debug('Services reçus:', services);
    logger.debug('Client ID:', client);
    logger.debug('Contrat ID:', contract);
    logger.debug('Taux de taxe:', taxRate);

    // Vérification des services
    if (!services || services.length === 0) {
      logger.warn('Erreur: Aucun service fourni');
      return res.status(400).json({
        success: false,
        message: 'Aucun service fourni'
      });
    }

    // Calculer le total pour chaque service avec son propre numberOfDays
    console.log('🔧 AVANT MAP - services:', services);
    console.log('🔧 AVANT MAP - services type:', typeof services);
    console.log('🔧 AVANT MAP - services length:', services?.length);
    
    const servicesWithTotals = await Promise.all(services.map(async (service, index) => {
      console.log(`🔧 Service ${index} reçu:`, {
        name: service.name,
        numberOfDays: service.numberOfDays,
        numberOfDaysType: typeof service.numberOfDays,
        numberOfAgents: service.numberOfAgents,
        dailyRate: service.dailyRate
      });
      
      let dailyRate = service.dailyRate; // Utiliser le dailyRate fourni par défaut
      
      if (service.prestationType === 'site_specific' && service.siteTariffId) {
        // Pour les services site_specific, récupérer le tarif depuis SiteTariff
        const siteTariff = await SiteTariff.findById(service.siteTariffId);
        if (!siteTariff) {
          logger.error('SiteTariff non trouvé pour ID:', service.siteTariffId);
          throw new Error('SiteTariff non trouvé');
        }
        
        dailyRate = siteTariff.useCustomValues 
          ? siteTariff.customDailyRate 
          : siteTariff.prestation.baseDailyRate;
      } else if (service.prestationType === 'classic' && service.prestationId) {
        // Pour les services classic, utiliser le dailyRate fourni directement
        // (il est déjà calculé dans le contrat)
        dailyRate = service.dailyRate;
      } else {
        // Fallback pour les anciens services (legacy)
        if (service.siteTariffId) {
          const siteTariff = await SiteTariff.findById(service.siteTariffId);
          if (siteTariff) {
            dailyRate = siteTariff.useCustomValues 
              ? siteTariff.customDailyRate 
              : siteTariff.prestation.baseDailyRate;
          }
        }
      }

      const serviceNumberOfDays = service.numberOfDays || 1; // Chaque prestation a ses propres jours
      
      console.log(`🔧 Service ${index} après traitement:`, {
        serviceNumberOfDays,
        dailyRate,
        numberOfAgents: service.numberOfAgents
      });
      
      const serviceSubTotal = dailyRate * serviceNumberOfDays * service.numberOfAgents;
      
      return {
        ...service,
        dailyRate,
        numberOfDays: serviceNumberOfDays, // Chaque prestation garde ses propres jours
        total: serviceSubTotal
      };
    }));

    // Calculer le sous-total de la facture
    const subTotal = servicesWithTotals.reduce((sum, service) => sum + service.total, 0);

    let taxTotal, total, taxDetails = null, taxName = req.body.taxName || '';
    let taxConfig = null;
    
    // Si taxName n'est pas fourni, le déduire à partir de taxRate
    if (!taxName && taxRate) {
      if (taxRate === 10.5) {
        taxName = 'TPS et CSS';
      } else if (taxRate === 9.5) {
        taxName = 'TPS';
      } else if (taxRate === 19) {
        taxName = 'TVA et CSS';
      } else if (taxRate === 18) {
        taxName = 'TVA 18%';
      }
    }
    
    if (taxName) {
      taxConfig = await Taxes.findOne({ taxName });
    }
    if (taxConfig) {
      if (taxConfig.taxName === 'TVA et CSS') {
        // TVA et CSS (18% + 1%)
        const tva = subTotal * 0.18;
        const css = subTotal * 0.01;
        taxTotal = tva + css;
        taxDetails = { tva, css };
      } else if (taxConfig.taxName === 'TPS et CSS') {
        // TPS et CSS (1% - 9.5% = -8.5%)
        const tps = subTotal * 0.095;
        const css = subTotal * 0.01;
        taxTotal = css - tps; // CSS - TPS (différence nette négative)
        taxDetails = { tps, css };
      } else if (taxConfig.taxName === 'TPS') {
        // TPS seul (9.5%)
        const tps = subTotal * 0.095;
        taxTotal = -tps; // TPS négatif (réduction)
        taxDetails = { tps };
      } else if (taxConfig.taxName === 'TPS CSS') {
        // TPS CSS (18.5% + 1%)
        const tps = subTotal * 0.185;
        const css = subTotal * 0.01;
        taxTotal = css - tps; // CSS - TPS (différence nette)
        taxDetails = { tps, css };
      } else if (taxConfig.taxName === 'TVA 18%') {
        // TVA seul (18%)
        const tva = subTotal * 0.18;
        taxTotal = tva;
        taxDetails = { tva };
      } else {
        // Taxe simple
        taxTotal = subTotal * (taxConfig.taxValue / 100);
        taxDetails = { tax: taxTotal };
      }
    } else {
      // Fallback si pas de config trouvée
      taxTotal = subTotal * (taxRate / 100);
      taxDetails = { tax: taxTotal };
    }
    
    // Calculer le total final selon le type de taxe
    if (taxConfig && taxConfig.taxName === 'TPS et CSS') {
      // TPS et CSS : utiliser taxTotal calculé (négatif)
      total = subTotal + taxTotal;
    } else if (taxConfig && taxConfig.taxName === 'TPS') {
      // TPS seul : utiliser taxTotal calculé (négatif)
      total = subTotal + taxTotal;
    } else if (taxConfig && taxConfig.taxName === 'TPS CSS') {
      // TPS CSS : utiliser taxTotal calculé (négatif)
      total = subTotal + taxTotal;
    } else if (taxConfig && taxConfig.taxName === 'TVA et CSS') {
      // TVA et CSS : utiliser taxTotal calculé (positif)
      total = subTotal + taxTotal;
    } else if (taxConfig && taxConfig.taxName === 'TVA 18%') {
      // TVA seul : utiliser taxTotal calculé (positif)
      total = subTotal + taxTotal;
    } else if (taxRate > 0) {
      // Autres taxes : additionner taxTotal
      total = subTotal + taxTotal;
    } else {
      // Pas de taxe
      total = subTotal;
    }

    // Déterminer le taxRate à sauvegarder
    let finalTaxRate = req.body.taxRate;
    if (taxConfig) {
      if (taxConfig.taxName === 'TPS et CSS') {
        finalTaxRate = 10.5;
      } else if (taxConfig.taxName === 'TPS') {
        finalTaxRate = 9.5;
      } else if (taxConfig.taxName === 'TVA et CSS') {
        finalTaxRate = 19;
      } else if (taxConfig.taxName === 'TVA 18%') {
        finalTaxRate = 18;
      } else {
        finalTaxRate = taxConfig.taxValue;
      }
    }

    const invoiceData = {
      number: req.body.number,
      year: req.body.year,
      date: req.body.date,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      object: req.body.object,
      notes: req.body.notes,
      client: req.body.client,
      contract: req.body.contract,
      services: servicesWithTotals,
      taxRate: finalTaxRate,
      taxName,
      taxDetails,
      subTotal,
      taxTotal,
      total,
      currency: req.body.currency,
      credit: 0,
      discount: 0,
      payment: [],
      paymentStatus: 'unpaid',
      isOverdue: false,
      approved: false,
      status: req.body.status || 'draft',
      createdBy: req.admin._id
    };

    logger.debug('Données de facture finales:', invoiceData);

    const invoice = await Invoice.create(invoiceData);
    logger.info('Facture créée avec succès:', invoice._id);

    // Mettre à jour last_invoice_number dans les settings
    await Setting.findOneAndUpdate(
      { settingKey: 'last_invoice_number' },
      { $set: { settingValue: invoice.number } },
      { new: true }
    );
    logger.info('Settings mis à jour avec le nouveau numéro de facture:', invoice.number);

    return res.status(201).json({
      success: true,
      result: invoice,
      message: 'Facture créée avec succès'
    });

  } catch (error) {
    logger.error('Erreur lors de la création de la facture:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la facture',
      stack: error.stack,
    });
  }
};

module.exports = create;
