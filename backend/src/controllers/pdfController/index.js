const pug = require('pug');
const fs = require('fs');
const moment = require('moment');
let pdf = require('html-pdf');
const path = require('path');
const { loadSettings } = require('../../middlewares/settings');
const useLanguage = require('../../locale/useLanguage');
const { useMoney } = require('../../settings');

// Configuration de PhantomJS
const phantomPath = process.env.PHANTOMJS_PATH || path.join(__dirname, '../../../node_modules/phantomjs-prebuilt/bin/phantomjs');
pdf.options = {
  phantomPath: phantomPath
};

const pugFiles = ['invoice', 'offer', 'quote', 'payment', 'contract'];

// Fonction de formatage de date
const formatDate = (date) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

// Fonction de formatage monétaire
const formatMoney = (amount) => {
  if (!amount) return '0.00';
  return parseFloat(amount).toFixed(2);
};

// Fonction de traduction
const translate = (key) => {
  const translations = {
    'Invoice': 'Facture',
    'Quote': 'Devis',
    'Contract': 'Contrat',
    'Date': 'Date',
    'Due Date': 'Date d\'échéance',
    'Expiry Date': 'Date d\'expiration',
    'Item': 'Article',
    'Description': 'Description',
    'Quantity': 'Quantité',
    'Unit Price': 'Prix unitaire',
    'Total': 'Total',
    'Tax': 'TVA',
    'Discount': 'Remise',
    'Grand Total': 'Total TTC',
    'Note': 'Note',
    'Bill To': 'Facturé à',
    'Client': 'Client',
    'No client information': 'Aucune information client',
    'No items': 'Aucun article'
  };
  return translations[key] || key;
};

exports.generatePdf = async (
  modelName,
  info = { filename: 'pdf_file', format: 'A5', targetLocation: '' },
  result,
  callback
) => {
  try {
    const { targetLocation } = info;
    console.log('Generating PDF:', { targetLocation, modelName });

    // Supprimer le PDF existant s'il existe
    if (fs.existsSync(targetLocation)) {
      fs.unlinkSync(targetLocation);
    }

    if (pugFiles.includes(modelName.toLowerCase())) {
      // Charger les paramètres de l'application
      const settings = await loadSettings();
      console.log('Loaded settings:', settings);

      // Si c'est un devis, peupler les services
      if (modelName.toLowerCase() === 'quote') {
        const Quote = require('../../models/appModels/Quote');
        const Taxes = require('../../models/appModels/Taxes');
        
        result = await Quote.findById(result._id)
          .populate('client')
          .exec();
        console.log('Quote data before PDF generation:', JSON.stringify(result, null, 2));
        console.log('Services in quote:', result.services);
        
        // Recalculer les taxes si taxDetails est incorrect
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
          await Quote.findByIdAndUpdate(result._id, {
            taxDetails: taxDetails,
            taxTotal: taxTotal,
            total: finalTotal
          });
          
          console.log('Recalculated taxDetails for PDF:', JSON.stringify(taxDetails, null, 2));
        }
      }

      // Configurer la langue
      const selectedLang = settings['idurar_app_language'];
      const translate = useLanguage({ selectedLang });

      // Configurer le formatage monétaire
      const {
        currency_symbol,
        currency_position,
        decimal_sep,
        thousand_sep,
        cent_precision,
        zero_format,
      } = settings;

      const { moneyFormatter } = useMoney({
        settings: {
          currency_symbol,
          currency_position,
          decimal_sep,
          thousand_sep,
          cent_precision,
          zero_format,
        },
      });

      // Ajouter le chemin du serveur public
      settings.public_server_file = process.env.PUBLIC_SERVER_FILE;

      // DEBUG LOGS pour le logo
      console.log('settings.company_logo:', settings.company_logo);
      console.log('settings.public_server_file:', settings.public_server_file);
      console.log('Chemin complet du logo pour le PDF:', settings.public_server_file + settings.company_logo);

      // Chemin du template
      const templatePath = path.join(__dirname, '../../pdf', modelName + '.pug');
      console.log('Template path:', templatePath);

      // Vérifier si le template existe
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      // Vérifier que les fonctions sont bien définies
      if (typeof moneyFormatter !== 'function') {
        throw new Error('moneyFormatter is not a function');
      }
      if (typeof translate !== 'function') {
        throw new Error('translate is not a function');
      }

      // Données pour le template
      const templateData = {
        model: result,
        settings,
        dateFormat: (date) => {
          if (!date) return '';
          return moment(date).format(settings.date_format || 'DD/MM/YYYY');
        },
        moneyFormatter,
        translate,
        moment
      };

      // Générer le HTML
      const htmlContent = pug.renderFile(templatePath, templateData);

      // Générer le PDF
      pdf
        .create(htmlContent, {
          format: info.format,
          orientation: 'portrait',
          border: '10mm'
        })
        .toFile(targetLocation, function (error) {
          if (error) {
            console.error('Error generating PDF:', error);
            throw error;
          }
          console.log('PDF generated successfully:', targetLocation);
          if (callback) callback();
        });
    } else {
      throw new Error(`Invalid model name: ${modelName}`);
    }
  } catch (error) {
    console.error('Error in generatePdf:', error);
    throw error;
  }
};
