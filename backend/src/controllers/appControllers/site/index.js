const mongoose = require('mongoose');
const SiteModel = mongoose.model('Site');
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');

// Génération automatique du CRUD de base
const methods = createCRUDController('Site');

// Création personnalisée
methods.create = async (req, res) => {
  try {
    const site = new SiteModel({
      ...req.body,
    });

    const result = await site.save();

    return res.status(201).json({
      success: true,
      result: result,
      message: 'Site créé avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création du site.',
      error: error.message,
    });
  }
};

// Lecture de tous les sites non supprimés
methods.readAll = async (req, res) => {
  try {
    const sites = await SiteModel.find({ removed: false });

    return res.status(200).json({
      success: true,
      result: sites,
      message: 'Sites récupérés avec succès',
    });
  } catch (error) {
    console.error('ERREUR readAll:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des sites.',
      error: error.message,
    });
  }
};

// Lecture d'un site spécifique
methods.readOne = async (req, res) => {
  const { id } = req.params;

  try {
    const site = await SiteModel.findOne({ _id: id, removed: false });

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé',
      });
    }

    return res.status(200).json({
      success: true,
      result: site,
      message: 'Site récupéré avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du site.',
      error: error.message,
    });
  }
};

// Mise à jour
methods.update = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await SiteModel.findOne({ _id: id, removed: false });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé',
      });
    }

    const result = await SiteModel.findOneAndUpdate({ _id: id }, req.body, { new: true });

    return res.status(200).json({
      success: true,
      result,
      message: 'Site mis à jour avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du site.',
      error: error.message,
    });
  }
};

// Suppression logique
methods.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await SiteModel.findOneAndUpdate(
      { _id: id },
      { removed: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Site non trouvé ou déjà supprimé',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Site supprimé avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du site.',
      error: error.message,
    });
  }
};

module.exports = methods;
