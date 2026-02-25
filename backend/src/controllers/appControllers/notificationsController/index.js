const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');
const Admin = mongoose.model('Admin');
const Contract = mongoose.model('Contract');
const Invoice = mongoose.model('Invoice');
const { exec } = require('child_process');
const express = require('express');  // Assurez-vous d'importer express

const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const { captureRejectionSymbol } = require('form-data');
const methods = createCRUDController('Notification'); 
const runPowerShellScript = (email, firstName) => {
  const powershellScriptPath = 'C:\\Users\\ztoure\\WORKSPACE\\idurar-erp-crm\\backend\\src\\scripts\\sendrelancecontract.ps1';
  console.log('powershellScriptPath=',powershellScriptPath);
  // Créer la commande PowerShell avec les paramètres nécessaires
  const command = `powershell -Command "& { ${powershellScriptPath} -email '${email}' -firstName '${firstName}' }"`;
  console.log('command=',command);
  console.log('Exécution de la commande PowerShell:', command);

  // Exécution de la commande PowerShell
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erreur lors de l'exécution du script PowerShell : ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`Erreur PowerShell : ${stderr}`);
      return;
    }

    console.log(`Résultat PowerShell : ${stdout}`);
  });
};

//route pour executer la commande :
const executeScriptRoute = async (req, res) => {
  const { email, name } = req.body;
  console.log('my req body:',req.body);
  if (!email || !name) {
    return res.status(400).json({
      success: false,
      message: 'Email et prénom sont nécessaires pour exécuter le script.',
    });
  }

  try {
    console.log('Appel de la fonction qui exécute le script PowerShell');
    runPowerShellScript(email, name);

    return res.status(200).json({
      success: true,
      message: 'Ouverture du mail',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'exécution du script.',
      error: error.message,
    });
  }
};

// Créer un routeur pour l'API
const router = express.Router();

// Définir la route pour exécuter le script PowerShell
router.post('/executescript', executeScriptRoute);
console.log('router tizi:,',router);
methods.readAll = async (req, res) => {
    try {
      // Récupérer toutes les notifications sans filtrage
      const notifications = await Notification.find().exec();
      console.log('realAll notifications');
      return res.status(200).json({
        success: true,
        result: notifications,
        message: 'Contrats récupérés avec succès',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de la récupération des contrats.',
        error: error.message,
      });
    }
  };
  
const notifyExpiringContracts = async () => {
  
  const now = new Date(); 
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(now.getDate() + 7); // Date dans 7 jours à partir d'aujourd'hui
  
  console.log('coucou');
  
  // Recherche des contrats qui expirent dans les 7 prochains jours
  const expiringContracts = await Contract.find({
    endDate: { $gte: now, $lte: sevenDaysLater }, // Contrats dont la date de fin est entre aujourd'hui et dans 7 jours
  });

  console.log('expiringContracts', expiringContracts);

  for (const contract of expiringContracts) {
    // Calculer la différence en jours entre la date d'expiration du contrat et la date actuelle
    const expiringDate = new Date(contract.endDate);
    const diffTime = expiringDate - now; // Différence en millisecondes
    const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convertir en jours
    console.log('remainingDays:',remainingDays);
    console.log('expiringDate=',expiringDate,'date now=',now,'diffTime=',diffTime);
    if (remainingDays <= 7 && remainingDays > 0) {
      const admins = await Admin.find(); // Récupère tous les admins
        console.log('admins;:',admins);
      for (const admin of admins) {
        
       const notificationMessage = `Le contrat ${contract.id} va expirer dans ${remainingDays} jour(s).`;

        // Vérification si la notification existe déjà (évite les doublons)
        const existingNotification = await Notification.findOne({
          relatedId: contract._id,
          user: admin._id,
          relatedType: 'Contract'
        });
        console.log('existingNotification=', existingNotification);

        if (!existingNotification) {
          // Si la notification n'existe pas, on la crée
          await Notification.create({
            message: notificationMessage,
            type: 'warning',
            user: admin._id, // L'ID de l'utilisateur (admin) qui reçoit la notification
            relatedId: contract._id,  // L'ID du contrat concerné
            relatedType: 'Contract',  // Le type de l'entité concernée
            notified: false,  // Par défaut, la notification est non vue
          });
          console.log(`Notification envoyée à ${admin._id} pour le contrat ${contract._id}`);
        } else {
          // Si la notification existe déjà, on peut choisir de ne rien faire ou afficher un message
          console.log(`La notification existe déjà pour ${admin._id} concernant le contrat ${contract._id}`);
        }
      }

      // Marquer le contrat comme notifié
      contract.notified = true;
      await contract.save();
    }
  }
};
const notifyExpiredInvoices = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);  // Calcul de la date 30 jours avant aujourd'hui
  console.log('fonction notify invoice.....');
  // Recherche des factures impayées créées il y a plus de 30 jours
  const invoices = await Invoice.find({
    paymentStatus: 'unpaid',
    date: { $lt: thirtyDaysAgo },  // Factures créées il y a plus de 30 jours
  }).exec();
console.log('invoices:',invoices);
  for (const invoice of invoices) {
    const admins = await Admin.find(); // Récupère tous les admins
    for (const admin of admins) {
      const formattedInvoiceDate = new Date(invoice.date).toLocaleDateString('fr-FR');

      const notificationMessage = `La facture n° ${invoice.number} créée le ${formattedInvoiceDate} est impayée depuis plus de 30 jours.`;

      // Vérifier si la notification existe déjà pour cette facture
      const existingNotification = await Notification.findOne({
        relatedId: invoice._id,
        user: admin._id,
        relatedType: 'Invoice',
      });

      if (!existingNotification) {
        // Si la notification n'existe pas, la créer
        await Notification.create({
          message: notificationMessage,
          type: 'warning',
          user: admin._id,  // L'ID de l'utilisateur (admin) qui reçoit la notification
          relatedId: invoice._id,  // L'ID de la facture concernée
          relatedType: 'Invoice',  // Le type de l'entité concernée
          notified: false,  // Par défaut, la notification est non vue
        });
        console.log(`Notification envoyée à ${admin._id} pour la facture ${invoice._id}`);
      } else {
        console.log(`La notification existe déjà pour ${admin._id} concernant la facture ${invoice._id}`);
      }
    }
  }
};

module.exports = {
    ...methods,
    notifyExpiringContracts,
    notifyExpiredInvoices,
    runPowerShellScript,
    router,
  };
