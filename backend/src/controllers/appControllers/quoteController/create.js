const mongoose = require('mongoose');
const Quote = mongoose.model('Quote');
const Contract = mongoose.model('Contract');
const Counter = mongoose.model('Counter');
const Setting = mongoose.model('Setting');
const dayjs = require('dayjs');
const Taxes = mongoose.model('Taxes'); // Added Taxes model import

const create = async (req, res) => {
  try {
    console.log('Début création devis - Données reçues:', req.body);
    
    const { services, prospect, prospectAddress, prospectPhone, contract, taxRate, startDate, endDate, number, year } = req.body;
    let taxName = req.body.taxName;
    console.log('Services reçus:', services);
    console.log('Prospect ID:', prospect);
    console.log('Adresse Prospect:', prospectAddress);
    console.log('Téléphone Prospect:', prospectPhone);
    console.log('Contrat ID:', contract);
    console.log('Taux de taxe:', taxRate);
    console.log('Nom de la taxe:', taxName);
    console.log('Période:', { startDate, endDate });
    console.log('Numéro de devis:', number);
    console.log('Année:', year);

    // Vérifier si le numéro de devis existe déjà pour cette année
    const existingQuote = await Quote.findOne({ 
      number: number, 
      year: year || new Date().getFullYear(),
      removed: false 
    });
    
    if (existingQuote) {
      console.log(`Erreur: Devis numéro ${number}/${year || new Date().getFullYear()} existe déjà`);
      return res.status(400).json({
        success: false,
        message: `Un devis avec le numéro ${number}/${year || new Date().getFullYear()} existe déjà. Veuillez choisir un autre numéro.`
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
        // TPS et CSS (-9.5% + 1% = -8.5%)
        const tps = subTotal * 0.095;
        const css = subTotal * 0.01;
        taxTotal = -tps + css; // TPS négatif (réduction) + CSS positif (addition)
        taxDetails = { tps: -tps, css: css }; // TPS stocké en négatif
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
      // TPS et CSS : utiliser taxTotal calculé (positif)
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

    // Créer le devis avec les totaux calculés
    const quoteData = {
      ...req.body,
      services: servicesWithTotals,
      subTotal,
      taxTotal,
      taxDetails,
      taxRate: finalTaxRate,
      total,
      createdBy: req.admin._id,
      status: req.body.status || 'draft',
      approved: false,
      isExpired: false,
      converted: false,
      credit: 0,
      discount: 0,
      currency: 'XAF',
      pdf: `quote-${req.body.number}.pdf`,
      files: [],
      updated: new Date(),
      created: new Date()
    };

    console.log('Quote data before creation:', JSON.stringify(quoteData, null, 2));
    console.log('taxDetails to be saved:', JSON.stringify(taxDetails, null, 2));

    const quote = await Quote.create(quoteData);
    
    console.log('Quote saved to database:', JSON.stringify(quote.toObject(), null, 2));

    // Récupérer le devis créé
    const populatedQuote = await Quote.findById(quote._id).exec();

    console.log('Created quote:', JSON.stringify(populatedQuote, null, 2));

    // Mettre à jour le compteur de devis
    const counter = await Counter.findOneAndUpdate(
      { _id: 'quoteId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Mettre à jour le dernier numéro de devis dans les paramètres
    await Setting.findOneAndUpdate(
      { settingKey: 'last_quote_number' },
      { $set: { settingValue: quote.number } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result: populatedQuote,
      message: 'Devis créé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

module.exports = create;
