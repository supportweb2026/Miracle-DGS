const custom = require('../../controllers/pdfController');
const puppeteerController = require('../../controllers/pdfController/puppeteerController');
const mongoose = require('mongoose');

// Ajouter l'import du nouveau contrôleur
const { generateInvoicePDF } = require('../../controllers/pdfController/invoicePuppeteerController');
const { generateQuotePDF } = require('../../controllers/pdfController/quotePuppeteerController');

module.exports = downloadPdf = async (req, res, { directory, id }) => {
  try {
    const modelName = directory.slice(0, 1).toUpperCase() + directory.slice(1);
    if (mongoose.models[modelName]) {
      const Model = mongoose.model(modelName);
      const result = await Model.findOne({
        _id: id,
      }).exec();

      // Throw error if no result
      if (!result) {
        throw { name: 'ValidationError' };
      }
      let translatedModelName;
    switch (modelName.toLowerCase()) {
      case 'quote':
        translatedModelName = 'Devis';
        break;
      case 'invoice':
        translatedModelName = 'Facture';
        break;
        case 'payment':
        translatedModelName = 'Paiement';
        break;
        case 'contract':
      translatedModelName = 'Contrat';
      break;
      default:
        // If no match, use the original modelName
        translatedModelName = modelName;
        break;
    }
      // Continue process if result is returned
    console.log('translatedModelName:',translatedModelName);
      const fileId = translatedModelName + '-' + result._id + '.pdf';
      const folderPath = modelName.toLowerCase();
      const targetLocation = `src/public/download/${folderPath}/${fileId}`;
      
      // Utiliser le nouveau contrôleur Puppeteer pour les contrats ET les factures
      if (modelName.toLowerCase() === 'contract') {
          console.log('🎯 Génération PDF du contrat avec Puppeteer...');
          try {
              await puppeteerController.generateContractPdf(result, targetLocation);
              console.log('✅ PDF généré avec Puppeteer, téléchargement...');
              return res.download(targetLocation, (error) => {
                  if (error) {
                      console.error('❌ Erreur téléchargement:', error);
                      return res.status(500).json({
                          success: false,
                          result: null,
                          message: "Couldn't find file",
                          error: error.message,
                      });
                  }
              });
          } catch (puppeteerError) {
              console.error('❌ ERREUR CRITIQUE avec Puppeteer:', puppeteerError.message);
              return res.status(500).json({
                  success: false,
                  result: null,
                  error: `Puppeteer a échoué: ${puppeteerError.message}`,
                  message: `Puppeteer a échoué: ${puppeteerError.message}`,
              });
          }
      } else if (modelName.toLowerCase() === 'invoice') {
          // NOUVELLE LOGIQUE pour les factures avec Puppeteer
          console.log('🎯 Génération PDF de la facture avec Puppeteer...');
          try {
              // Créer un objet req simulé pour generateInvoicePDF
              const mockReq = {
                  params: { id: id },
                  query: { lang: 'fr' } // Ajouter la propriété query avec lang
              };
              
              // Créer un objet res simulé pour capturer la réponse
              const mockRes = {
                  json: (data) => {
                      if (data.success) {
                          // Si le PDF est généré avec succès, télécharger le fichier
                          const pdfPath = data.filePath;
                          return res.download(pdfPath, (error) => {
                              if (error) {
                                  console.error('❌ Erreur téléchargement facture:', error);
                                  return res.status(500).json({
                                      success: false,
                                      result: null,
                                      message: "Couldn't find file",
                                      error: error.message,
                                  });
                              }
                          });
                      } else {
                          return res.status(500).json(data);
                      }
                  },
                  status: (code) => ({
                      json: (data) => res.status(code).json(data)
                  })
              };
              
              await generateInvoicePDF(mockReq, mockRes);
              console.log('✅ PDF facture généré avec Puppeteer');
          } catch (puppeteerError) {
              console.error('❌ ERREUR CRITIQUE avec Puppeteer facture:', puppeteerError.message);
              return res.status(500).json({
                  success: false,
                  result: null,
                  error: `Puppeteer facture a échoué: ${puppeteerError.message}`,
                  message: `Puppeteer facture a échoué: ${puppeteerError.message}`,
              });
          }
      } else if (modelName.toLowerCase() === 'quote') {
          // NOUVELLE LOGIQUE pour les devis avec Puppeteer
          console.log('🎯 Génération PDF du devis avec Puppeteer...');
          try {
              // Créer un objet req simulé pour generateQuotePDF
              const mockReq = {
                  params: { id: id },
                  query: { lang: 'fr' }
              };
              
              // Créer un objet res simulé pour capturer la réponse
              const mockRes = {
                  json: (data) => {
                      if (data.success) {
                          // Si le PDF est généré avec succès, télécharger le fichier
                          const pdfPath = data.filePath;
                          console.log('📁 Chemin du PDF généré:', pdfPath);
                          return res.download(pdfPath, (error) => {
                              if (error) {
                                  console.error('❌ Erreur téléchargement devis:', error);
                                  return res.status(500).json({
                                      success: false,
                                      result: null,
                                      message: "Couldn't find file",
                                      error: error.message,
                                  });
                              }
                          });
                      } else {
                          console.error('❌ Erreur génération PDF devis:', data);
                          return res.status(500).json(data);
                      }
                  },
                  status: (code) => ({
                      json: (data) => {
                          console.error(`❌ Erreur HTTP ${code} génération PDF devis:`, data);
                          return res.status(code).json(data);
                      }
                  })
              };
              
              console.log('🚀 Appel de generateQuotePDF avec ID:', id);
              await generateQuotePDF(mockReq, mockRes);
              console.log('✅ PDF devis généré avec Puppeteer');
          } catch (puppeteerError) {
              console.error('❌ ERREUR CRITIQUE avec Puppeteer devis:', puppeteerError);
              console.error('❌ Stack trace:', puppeteerError.stack);
              return res.status(500).json({
                  success: false,
                  result: null,
                  error: `Puppeteer devis a échoué: ${puppeteerError.message}`,
                  message: `Puppeteer devis a échoué: ${puppeteerError.message}`,
              });
          }
      } else {
        // Utiliser l'ancien système pour les autres types de documents
        console.log(`📄 Génération PDF de ${modelName} avec l'ancien système...`);
        await custom.generatePdf(
          modelName,
          { filename: folderPath, format: 'A4', targetLocation },
          result,
          async () => {
            return res.download(targetLocation, (error) => {
              if (error)
                return res.status(500).json({
                  success: false,
                  result: null,
                  message: "Couldn't find file",
                  error: error.message,
                });
            });
          }
        );
        return; // Sortir de la fonction car l'ancien système gère déjà le téléchargement
      }
      
    } else {
      return res.status(404).json({
        success: false,
        result: null,
        message: `Model '${modelName}' does not exist`,
      });
    }
  } catch (error) {
    // If error is thrown by Mongoose due to required validations
    if (error.name == 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Champs requis non replis',
      });
    } else if (error.name == 'BSONTypeError') {
      // If error is thrown by Mongoose due to invalid ID
      return res.status(400).json({
        success: false,
        result: null,
        error: error.message,
        message: 'Invalid ID',
      });
    } else {
      // Server Error
      return res.status(500).json({
        success: false,
        result: null,
        error: error.message,
        message: error.message,
        controller: 'downloadPDF.js',
      });
    }
  }
};
