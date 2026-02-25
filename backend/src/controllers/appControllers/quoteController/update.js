const mongoose = require('mongoose');
const Model = mongoose.model('Quote');
const Taxes = mongoose.model('Taxes');
const custom = require('../../../controllers/pdfController');
const { calculate } = require('../../../helpers');
const dayjs = require('dayjs');

const update = async (req, res) => {
  try {
    console.log('Début mise à jour devis - Données reçues:', req.body);
    
    const { services, taxRate } = req.body;
    let taxName = req.body.taxName;

    // Vérifier si le devis existe
    const existingQuote = await Model.findOne({
      _id: req.params.id,
      removed: false,
    });

    if (!existingQuote) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Devis non trouvé',
      });
    }

    // Vérification des services
    if (!services || services.length === 0) {
      console.log('Erreur: Aucun service fourni');
      return res.status(400).json({
        success: false,
        message: 'Aucun service fourni'
      });
    }

    // Calculer le total pour chaque service avec son propre numberOfDays
    console.log('🔧 AVANT MAP - services:', services);
    console.log('🔧 AVANT MAP - services type:', typeof services);
    console.log('🔧 AVANT MAP - services length:', services?.length);
    
    const servicesWithTotals = services.map((service, index) => {
      console.log(`🔧 Service ${index} reçu:`, {
        name: service.name,
        numberOfDays: service.numberOfDays,
        numberOfDaysType: typeof service.numberOfDays,
        numberOfAgents: service.numberOfAgents,
        dailyRate: service.dailyRate
      });
      
      const dailyRate = service.dailyRate;
      const serviceNumberOfDays = service.numberOfDays || 1; // Chaque prestation a ses propres jours
      
      console.log(`🔧 Service ${index} après traitement:`, {
        serviceNumberOfDays,
        dailyRate,
        numberOfAgents: service.numberOfAgents
      });
      
      const serviceSubTotal = dailyRate * serviceNumberOfDays * service.numberOfAgents;
      
      return {
        name: service.name,
        startDate: service.startDate,
        endDate: service.endDate,
        dailyRate: dailyRate,
        numberOfAgents: service.numberOfAgents,
        numberOfDays: serviceNumberOfDays, // Chaque prestation garde ses propres jours
        total: serviceSubTotal
      };
    });

    // Calculer le sous-total du devis
    const subTotal = servicesWithTotals.reduce((sum, service) => sum + service.total, 0);
    
    // Calculer les taxes selon le type
    let taxTotal, taxDetails = null;
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
        taxTotal = -tps; // TPS négatif (réduction) - CORRECTION POUR COHÉRENCE AVEC FACTURES
        taxDetails = { tps };
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

    // Calculer le total final selon le type de taxe - CORRECTION POUR COHÉRENCE AVEC FACTURES
    let total;
    if (taxConfig && taxConfig.taxName === 'TPS et CSS') {
      // TPS et CSS : utiliser taxTotal calculé (négatif)
      total = subTotal + taxTotal;
    } else if (taxConfig && taxConfig.taxName === 'TPS') {
      // TPS seul : utiliser taxTotal calculé (négatif)
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
    let finalTaxRate = taxRate;
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
      total,
      pdf: `quote-${req.body.number}.pdf`,
      updated: new Date()
    };

    console.log('Quote update data:', JSON.stringify(updateData, null, 2));
    console.log('taxDetails to be saved:', JSON.stringify(taxDetails, null, 2));

    // Mettre à jour le devis
    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false },
      updateData,
      { new: true }
    ).exec();

    console.log('Devis mis à jour avec succès:', result);

    return res.status(200).json({
      success: true,
      result,
      message: 'Mise à jour effectuée',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du devis:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Erreur lors de la mise à jour du devis',
      error: error.message,
    });
  }
};

module.exports = update;
