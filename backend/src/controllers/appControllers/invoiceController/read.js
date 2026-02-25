const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

const Model = mongoose.model('Invoice');
const Taxes = mongoose.model('Taxes');

const read = async (req, res) => {
  try {
    process.stdout.write('test tizi');
    // Find document by id
    const result = await Model.findOne({
      _id: req.params.id,
      removed: false,
    })
      .populate('createdBy', 'name')
      .populate('client')
      .populate('contract')
      .populate({
        path: 'services.siteTariffId',
        populate: {
          path: 'prestation',
          model: 'Prestation'
        }
      })
      .populate({
        path: 'services.siteTariffId',
        populate: {
          path: 'site',
          model: 'Site'
        }
      })
      .populate('services.prestationId')
      .populate('services.siteId')
      .exec();
    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found ',
      });
    } else {
      // Debug logs pour les nouveaux champs
      console.log('=== DEBUG INVOICE FIELDS ===');
      console.log('startDate:', result.startDate);
      console.log('endDate:', result.endDate);
      console.log('object:', result.object);
      console.log('=== END DEBUG ===');
      // Recalculer les taxes si taxDetails est null
      if (!result.taxDetails && result.taxRate > 0) {
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
            // TPS et CSS (1% - 9.5% = -8.5%)
            const tps = result.subTotal * 0.095;
            const css = result.subTotal * 0.01;
            taxTotal = css - tps; // CSS - TPS (différence nette négative)
            taxDetails = { tps, css };
          } else if (taxConfig.taxName === 'TPS') {
            // TPS seul (9.5%)
            const tps = result.subTotal * 0.095;
            taxTotal = -tps; // TPS négatif (réduction)
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
        
        // Mettre à jour le résultat avec les taxes recalculées
        result.taxDetails = taxDetails;
        result.taxTotal = taxTotal;
        result.total = result.subTotal + taxTotal;
        
        // Sauvegarder les taxes recalculées en base de données
        await Model.findByIdAndUpdate(result._id, {
          taxDetails: taxDetails,
          taxTotal: taxTotal,
          total: result.total
        });
      }
      
      // Return success resposne
      return res.status(200).json({
        success: true,
        result,
        message: 'we found this document ',
      });
    }
  } catch (error) {
    // Forçage direct avec des caractères spéciaux
    process.stdout.write('\n\n');
    process.stdout.write('==========================================\n');
    process.stdout.write('ERREUR CRITIQUE DANS READ INVOICE\n');
    process.stdout.write('==========================================\n');
    process.stdout.write(`Message: ${error.message}\n`);
    process.stdout.write(`Stack: ${error.stack}\n`);
    process.stdout.write('==========================================\n\n');
    
    // On garde aussi le logger original
    logger.error('Erreur lors de la lecture de la facture:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la lecture de la facture',
      stack: error.stack,
    });
  }
};

module.exports = read;
