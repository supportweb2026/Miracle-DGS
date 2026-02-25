const mongoose = require('mongoose');
const PrestationModel = mongoose.model('Prestation');  // Le modèle de prestation
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Prestation');  // Création du CRUD pour "Prestation"

// Supprimer la méthode de suppression si nécessaire
// delete methods['delete'];  // Si tu veux supprimer la suppression (par exemple si tu ne veux pas autoriser la suppression)

// Méthode de création pour une prestation
methods.create = async (req, res) => {
  try {
    // Crée un nouveau document de prestation à partir des données envoyées dans la requête
    const prestation = new PrestationModel({
      ...req.body,  // Inclut les champs comme name, baseDuration, baseHourlyRate, baseDailyRate, etc.
    });

    const result = await prestation.save();  // Sauvegarde du nouveau document

    return res.status(201).json({
      success: true,
      result: result,
      message: 'Prestation créée avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création de la prestation.',
      error: error.message,
    });
  }
};

// Méthode de lecture pour obtenir toutes les prestations
methods.readAll = async (req, res) => {
  try {
    const prestations = await PrestationModel.find({ removed: false });  // Filtrer les prestations non supprimées

    return res.status(200).json({
      success: true,
      result: prestations,
      message: 'Prestations récupérées avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des prestations.',
      error: error.message,
    });
  }
};

// Méthode de lecture pour obtenir une prestation spécifique
methods.readOne = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la prestation

  try {
    const prestation = await PrestationModel.findOne({ _id: id, removed: false });  // Trouve la prestation par son ID
    if (!prestation) {
      return res.status(404).json({
        success: false,
        message: 'Prestation non trouvée',
      });
    }

    return res.status(200).json({
      success: true,
      result: prestation,
      message: 'Prestation récupérée avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération de la prestation.',
      error: error.message,
    });
  }
};

// Méthode de mise à jour pour une prestation
methods.update = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la prestation à mettre à jour

  try {
    const prestation = await PrestationModel.findOne({ _id: id, removed: false });  // Trouve la prestation par son ID

    if (!prestation) {
      return res.status(404).json({
        success: false,
        message: 'Prestation non trouvée',
      });
    }

    // Met à jour la prestation avec les nouvelles données envoyées
    const result = await PrestationModel.findOneAndUpdate(
      { _id: id },
      req.body,  // Utilise les données envoyées dans la requête
      { new: true }  // Retourne la version mise à jour du document
    );

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Prestation mise à jour avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour de la prestation.',
      error: error.message,
    });
  }
};

// Méthode de suppression de la prestation (marquage comme supprimée)
methods.delete = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la prestation à supprimer

  try {
    // Marquer la prestation comme supprimée au lieu de la supprimer définitivement
    const result = await PrestationModel.findOneAndUpdate(
      { _id: id },
      { removed: true },  // Marque la prestation comme supprimée
      { new: true }  // Retourne la version mise à jour du document
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Prestation non trouvée ou déjà supprimée',
      });
    }

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Prestation marquée comme supprimée avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la suppression de la prestation.',
      error: error.message,
    });
  }
};

module.exports = methods;
