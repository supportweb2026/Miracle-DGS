const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');
const SiteTariff = mongoose.model('SiteTariff');
const Taxes = mongoose.model('Taxes');
const schema = require('./schemaValidate');
const dayjs = require('dayjs');

const update = async (req, res) => {
  try {
    console.log('Données reçues pour la mise à jour:', req.body);
    console.log('🔍 Notes reçues:', req.body.notes);
    
    // Validation Joi désactivée temporairement
    // const { error, value } = schema.validate(req.body);
    // if (error) {
    //   console.log('Erreur de validation:', error.details);
    //   return res.status(400).json({
    //     success: false,
    //     result: null,
    //     message: error.details[0]?.message,
    //   });
    // }

    // Vérifier si la facture existe
    const existingInvoice = await Model.findOne({
      _id: req.params.id,
      removed: false,
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Facture non trouvée',
      });
    }

    const { services, taxRate } = req.body;

    // Calculer le total pour chaque service
    const servicesWithTotals = await Promise.all(services.map(async (service) => {
      console.log('=== ANALYSE DU SERVICE ===');
      console.log('Service complet:', service);
      console.log('prestationType:', service.prestationType);
      console.log('siteTariffId:', service.siteTariffId);
      console.log('prestationId:', service.prestationId);
      console.log('siteId:', service.siteId);
      console.log('dailyRate fourni:', service.dailyRate);
      
      let dailyRate = service.dailyRate; // Utiliser le dailyRate fourni par défaut
      
      // Déterminer le type de service en fonction de prestationType
      if (service.prestationType === 'site_specific' && service.siteTariffId) {
        console.log('Service site_specific détecté');
        // Service site_specific : récupérer le tarif depuis SiteTariff
        const siteTariff = await SiteTariff.findById(service.siteTariffId);
        if (!siteTariff) {
          console.error('SiteTariff non trouvé pour ID:', service.siteTariffId);
          throw new Error('SiteTariff non trouvé');
        }
        
        dailyRate = siteTariff.useCustomValues 
          ? siteTariff.customDailyRate 
          : siteTariff.prestation.baseDailyRate;
        console.log('DailyRate calculé depuis SiteTariff:', dailyRate);
      } else if (service.prestationType === 'classic' && service.prestationId && service.siteId) {
        console.log('Service classic détecté');
        // Service classic : utiliser le dailyRate fourni directement
        // (il est déjà calculé dans le contrat)
        dailyRate = service.dailyRate;
        console.log('DailyRate utilisé tel quel:', dailyRate);
      } else if (service.prestationType === 'legacy') {
        console.log('Service legacy détecté');
        // Service legacy : utiliser le dailyRate fourni tel quel
        dailyRate = service.dailyRate;
        console.log('DailyRate legacy utilisé:', dailyRate);
      } else {
        console.log('Type de service non reconnu, utilisation du dailyRate fourni');
        console.log('prestationType:', service.prestationType);
        console.log('siteTariffId présent:', !!service.siteTariffId);
        console.log('prestationId présent:', !!service.prestationId);
        console.log('siteId présent:', !!service.siteId);
      }

      const numberOfDays = service.numberOfDays || 1;
      const serviceSubTotal = dailyRate * numberOfDays * service.numberOfAgents;
      
      console.log('Résultat final - dailyRate:', dailyRate, 'numberOfDays:', numberOfDays, 'numberOfAgents:', service.numberOfAgents, 'total:', serviceSubTotal);
      console.log('=== FIN ANALYSE DU SERVICE ===');
      
      return {
        ...service,
        dailyRate,
        total: serviceSubTotal
      };
    }));

    // Calculer le sous-total de la facture
    const subTotal = servicesWithTotals.reduce((sum, service) => sum + service.total, 0);
    
    // Calculer les taxes selon le type
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

    // Préparer les données de mise à jour
    const { ...bodyWithoutTaxName } = req.body;
    const updateData = {
      ...bodyWithoutTaxName,
      services: servicesWithTotals,
      taxDetails,
      taxRate: finalTaxRate,
      subTotal,
      taxTotal,
      total
    };

    // Mettre à jour la facture
    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false },
      updateData,
      { new: true }
    ).exec();

    console.log('Facture mise à jour avec succès:', result);

    return res.status(200).json({
      success: true,
      result,
      message: 'Mise à jour effectuée',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Erreur lors de la mise à jour de la facture',
      error: error.message,
    });
  }
};

module.exports = update;
