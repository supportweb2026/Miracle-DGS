const mongoose = require('mongoose');

const Model = mongoose.model('Quote');
const Taxes = mongoose.model('Taxes');

const read = async (req, res) => {
  // Find document by id
  const result = await Model.findOne({
    _id: req.params.id,
    removed: false,
  })
    //.populate('createdBy', 'name')
    .exec();
  // If no results found, return document not found
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    // Recalculer les taxes si taxDetails est null ou incorrect
    if (!result.taxDetails || (result.taxDetails.tax && !result.taxDetails.tps && !result.taxDetails.tva)) {
      let taxDetails = null;
      let taxTotal = 0;
      
      // Essayer de trouver la taxe par nom
      let taxConfig = null;
      if (result.taxName) {
        taxConfig = await Taxes.findOne({ taxName: result.taxName });
      }
      
      // Si pas trouvé par nom, essayer de deviner selon le taux
      if (!taxConfig) {
        if (result.taxRate === 10.5) {
          taxConfig = await Taxes.findOne({ taxName: 'TPS et CSS' });
        } else if (result.taxRate === 9.5) {
          taxConfig = await Taxes.findOne({ taxName: 'TPS' });
        } else if (result.taxRate === 19) {
          taxConfig = await Taxes.findOne({ taxName: 'TVA et CSS' });
        } else if (result.taxRate === 18) {
          taxConfig = await Taxes.findOne({ taxName: 'TVA 18%' });
        }
      }
      
      if (taxConfig) {
        if (taxConfig.taxName === 'TVA et CSS') {
          // TVA et CSS (18% + 1%)
          const tva = result.subTotal * 0.18;
          const css = result.subTotal * 0.01;
          taxTotal = tva + css;
          taxDetails = { tva, css };
        } else if (taxConfig.taxName === 'TPS et CSS') {
          // TPS et CSS (9.5% + 1%)
          const tps = result.subTotal * 0.095;
          const css = result.subTotal * 0.01;
          taxTotal = css - tps; // CSS - TPS (différence nette) - CORRECTION POUR COHÉRENCE AVEC FACTURES
          taxDetails = { tps, css };
        } else if (taxConfig.taxName === 'TPS') {
          // TPS seul (9.5%)
          const tps = result.subTotal * 0.095;
          taxTotal = -tps; // TPS négatif (réduction) - CORRECTION POUR COHÉRENCE AVEC FACTURES
          taxDetails = { tps };
        } else if (taxConfig.taxName === 'TVA 18%') {
          // TVA seul (18%)
          const tva = result.subTotal * 0.18;
          taxTotal = tva;
          taxDetails = { tva };
        } else {
          // Taxe simple
          taxTotal = result.subTotal * (taxConfig.taxValue / 100);
          taxDetails = { tax: taxTotal };
        }
      } else {
        // Fallback
        taxTotal = result.subTotal * (result.taxRate / 100);
        taxDetails = { tax: taxTotal };
      }
      
      // Calculer le total final selon le type de taxe - CORRECTION POUR COHÉRENCE AVEC FACTURES
      let finalTotal;
      if (taxConfig && taxConfig.taxName === 'TPS et CSS') {
        // TPS et CSS : soustraire TPS, ajouter CSS
        finalTotal = result.subTotal - (result.subTotal * 0.095) + (result.subTotal * 0.01);
      } else if (taxConfig && taxConfig.taxName === 'TPS') {
        // TPS seul : soustraire TPS
        finalTotal = result.subTotal - (result.subTotal * 0.095);
      } else if (taxConfig && taxConfig.taxName === 'TVA et CSS') {
        // TVA et CSS : ajouter TVA et CSS
        finalTotal = result.subTotal + (result.subTotal * 0.18) + (result.subTotal * 0.01);
      } else if (taxConfig && taxConfig.taxName === 'TVA 18%') {
        // TVA seul : ajouter TVA
        finalTotal = result.subTotal + (result.subTotal * 0.18);
      } else if (result.taxRate > 0) {
        // Autres taxes : additionner taxTotal
        finalTotal = result.subTotal + taxTotal;
      } else {
        // Pas de taxe
        finalTotal = result.subTotal;
      }
      
      // Mettre à jour le résultat avec les taxes recalculées
      result.taxDetails = taxDetails;
      result.taxTotal = taxTotal;
      result.total = finalTotal;
      
      // Mettre à jour en base de données pour les devis existants
      await Model.findByIdAndUpdate(result._id, {
        taxDetails: taxDetails,
        taxTotal: taxTotal,
        total: finalTotal
      });
      
      console.log('Recalculated taxDetails for PDF:', JSON.stringify(taxDetails, null, 2));
    }
    
    // Return success resposne
    return res.status(200).json({
      success: true,
      result,
      message: 'we found this document ',
    });
  }
};

module.exports = read;
