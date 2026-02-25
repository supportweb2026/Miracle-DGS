const mongoose = require('mongoose');
const Invoice = mongoose.model('Invoice');
const Quote = mongoose.model('Quote');
const { increaseBySettingKey } = require('../../../middlewares/settings');
const { calculate } = require('../../../helpers');
console.log('TIZI')

  //logger.info('Une requête GET a été reçue sur /example');  // Log d'information
 

const convertQuoteToInvoice = async (req, res) => {
// app.js
  try {
    let id = req.params.id;
    console.log('ID:', req.params.id);
    const quote = await Quote.findOne({ _id: id });
    console.log('quote:', quote);
    if (quote.converted) {
      return res.status(400).json({
        message: 'Ce devis a déjà été convertie en facture.',
      });
    }
    const newInvoice = new Invoice({
      removed: quote.removed || false,
      createdBy: req.admin._id, // Utilisation de l'admin connecté
      number: quote.number || 1,
      year: new Date().getFullYear(),
      date: new Date(),
      expiredDate: quote.expiredDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      client: quote.client || null, 
      contract: quote.contract || null, 
      services: quote.services || [],
      taxRate: quote.taxRate || 0,
      subTotal: quote.subTotal || 0,
      taxTotal: quote.taxTotal || 0,
      total: quote.total ,
      currency: quote.currency || 'NA',
      credit: quote.credit || 0,
      discount: quote.discount || 0,
      payment: [], // Par défaut vide
      paymentStatus: 'unpaid',
      isOverdue: false,
      approved: false,
      status: 'draft',
      pdf: `invoice-${id}.pdf`, 
      files: [], // Liste des fichiers (initialement vide)
      updated: new Date(),
      created: new Date(),
    });
   /* body['files'] = []; 
    body['updated'] = new Date();
    body['created'] = new Date();
    delete body.converted;
    delete body.isExpired;*/

    // Créez une nouvelle facture avec les données de body
    console.log('Saving invoice:', newInvoice);  // Log avant save

    await newInvoice.save();
    await Quote.updateOne({ _id: id }, { $set: { converted: true, status: "accepted" } });

    //await Quote.updateOne({ _id: id }, { $set: { converted: true } });



    // Vous pouvez également mettre à jour un numéro de facture ou autre paramètre ici
    increaseBySettingKey({
      settingKey: 'last_invoice_number',
    });

    return res.status(200).json({
      success: true,
      message: 'Conversion en Facture réussie',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error converting quote to invoice',
      error: error.message,
    });
  }
};

module.exports = convertQuoteToInvoice;
