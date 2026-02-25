const express = require('express');
const { catchErrors } = require('../../handlers/errorHandlers');
const router = express.Router();

const appControllers = require('../../controllers/appControllers');
const expense =  require('../../controllers/appControllers/expense/getTotalExpenseForMonth');
//const reportController = require('../../controllers/report');
const notificationController = require('../../controllers/appControllers/notificationsController');
const invoiceController = require('../../controllers/appControllers/invoiceController');
const quoteController = require('../../controllers/appControllers/quoteController');
const paymentController = require('../../controllers/appControllers/paymentController');
const clientController = require('../../controllers/appControllers/clientController');
const contractController = require('../../controllers/appControllers/contractController');

const { routesList } = require('../../models/utils');

const routerApp = (entity, controller) => {
  console.log('entity:',entity, 'controller:',controller);
  router.route(`/${entity}/create`).post(catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['readOne']));
  router.route(`/${entity}/update/:id`).patch(catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));
  router.route('/expense/total').get(catchErrors(expense)); //Ajout total dépenses
 // router.route('/rapport').get(catchErrors(reportController.getReport));
  router.use('/notification', notificationController.router);
  console.log('router notification =', notificationController.router);

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }
};

// Routes spécifiques pour les entités principales
routerApp('invoice', invoiceController);
routerApp('quote', quoteController);
routerApp('payment', paymentController);
routerApp('client', clientController);
routerApp('contract', contractController);

// Ajoute les routes pour chaque entité définie dans routesList
routesList.forEach(({ entity, controllerName }) => {
  if (!['invoice', 'quote', 'payment', 'client', 'contract'].includes(entity)) {
    const controller = appControllers[controllerName];
    routerApp(entity, controller);
  }
});

module.exports = router;
