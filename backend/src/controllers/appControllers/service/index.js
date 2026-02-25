const mongoose = require('mongoose');
const ServiceModel = mongoose.model('Service');  // Le modèle Service
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Service');  // Création du CRUD pour "Service"

// Supprimer la méthode de suppression si nécessaire
// delete methods['delete'];  // Si vous ne souhaitez pas permettre la suppression, vous pouvez la désactiver ici.

// Méthode de création pour le service
methods.create = async (req, res) => {
  try {
    // Crée un nouveau document de service à partir des données envoyées dans la requête
    const service = new ServiceModel({
      ...req.body,  // Inclut les champs comme name, description, tauxJournalier, currency
    });

    const result = await service.save();  // Sauvegarde du nouveau document

    return res.status(201).json({
      success: true,
      result: result,
      message: 'Service created successfully',  // Message de succès
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the service.',
      error: error.message,  // Message d'erreur si la création échoue
    });
  }
};

// Méthode de lecture pour obtenir tous les services
methods.readAll = async (req, res) => {
  try {
    // Filtrer les services non supprimés
    const services = await ServiceModel.find({ removed: false });

    return res.status(200).json({
      success: true,
      result: services,
      message: 'Services fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching services.',
      error: error.message,
    });
  }
};

// Méthode de lecture pour obtenir un service spécifique
methods.readOne = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID du service

  try {
    const service = await ServiceModel.findOne({ _id: id, removed: false });  // Trouve le service par son ID
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: service,
      message: 'Service fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the service.',
      error: error.message,
    });
  }
};

// Méthode de mise à jour pour le service
methods.update = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID du service à mettre à jour

  try {
    // Vérifie si le service existe et n'est pas marqué comme supprimé
    const service = await ServiceModel.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Met à jour le service avec les nouvelles données envoyées
    const result = await ServiceModel.findOneAndUpdate(
      { _id: id },
      req.body,
      { new: true }  // Retourne la version mise à jour du document
    );

    return res.status(200).json({
      success: true,
      result: result,  // Données mises à jour
      message: 'Service updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the service.',
      error: error.message,
    });
  }
};

// Méthode de suppression du service (optionnel)
methods.delete = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID du service à supprimer

  try {
    // Marquer le service comme supprimé
    const result = await ServiceModel.findOneAndUpdate(
      { _id: id },
      { removed: true },  // Marque le service comme supprimé
      { new: true }  // Retourne la version mise à jour du document
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or already removed',
      });
    }

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Service marked as removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the service.',
      error: error.message,
    });
  }
};

module.exports = methods;
