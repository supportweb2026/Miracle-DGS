const mongoose = require('mongoose');
const SiteTariffModel = mongoose.model('SiteTariff'); // Le modèle SiteTariff
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('SiteTariff'); // Création du CRUD pour "SiteTariff"

// Méthode de création pour un tarif de site
methods.create = async (req, res) => {
  try {
    // Crée un nouveau document SiteTariff à partir des données envoyées dans la requête
    const siteTariff = new SiteTariffModel({
      ...req.body,  // Inclut les champs comme site, prestation, useCustomValues, etc.
    });

    const result = await siteTariff.save();  // Sauvegarde du nouveau document

    return res.status(201).json({
      success: true,
      result: result,
      message: 'Tarif de site créé avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création du tarif de site.',
      error: error.message,
    });
  }
};

// Méthode de lecture pour obtenir tous les tarifs de sites
methods.readAll = async (req, res) => {
  try {
    const siteTariffs = await SiteTariffModel.find({ removed: false });  // Filtrer les tarifs de sites non supprimés

    return res.status(200).json({
      success: true,
      result: siteTariffs,
      message: 'Tarifs de site récupérés avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération des tarifs de sites.',
      error: error.message,
    });
  }
};

// Méthode personnalisée pour filtrer les tarifs par site
methods.list = async (req, res) => {
  try {
    const { filter, equal } = req.query;
    
    // Si on filtre par site, utiliser une requête personnalisée
    if (filter === 'site' && equal) {
      console.log('🔍 SiteTariff - Filtrage par site:', equal);
      
      const siteTariffs = await SiteTariffModel.find({
        removed: false,
        site: equal
      }).populate('site prestation');
      
      console.log('🔍 SiteTariff - Tarifs trouvés:', siteTariffs.length);
      
      return res.status(200).json({
        success: true,
        result: siteTariffs,
        message: `Tarifs trouvés pour le site ${equal}`,
      });
    }
    
    // Sinon, utiliser la méthode générique
    const paginatedList = require('../../../controllers/middlewaresControllers/createCRUDController/paginatedList');
    return paginatedList(SiteTariffModel, req, res);
    
  } catch (error) {
    console.error('🔍 SiteTariff - Erreur lors du filtrage:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors du filtrage des tarifs.',
      error: error.message,
    });
  }
};

// Méthode de lecture pour obtenir un tarif de site spécifique
methods.readOne = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID du tarif de site

  try {
    const siteTariff = await SiteTariffModel.findOne({ _id: id, removed: false });  // Trouve le tarif par son ID
    if (!siteTariff) {
      return res.status(404).json({
        success: false,
        message: 'Tarif de site non trouvé',
      });
    }

    return res.status(200).json({
      success: true,
      result: siteTariff,
      message: 'Tarif de site récupéré avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération du tarif de site.',
      error: error.message,
    });
  }
};

// Méthode de mise à jour pour un tarif de site
methods.update = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID du tarif de site à mettre à jour

  try {
    const siteTariff = await SiteTariffModel.findOne({ _id: id, removed: false });  // Trouve le tarif par son ID

    if (!siteTariff) {
      return res.status(404).json({
        success: false,
        message: 'Tarif de site non trouvé',
      });
    }

    // Met à jour le tarif avec les nouvelles données envoyées
    const result = await SiteTariffModel.findOneAndUpdate(
      { _id: id },
      req.body,  // Utilise les données envoyées dans la requête
      { new: true }  // Retourne la version mise à jour du document
    );

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Tarif de site mis à jour avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour du tarif de site.',
      error: error.message,
    });
  }
};

// Méthode de suppression du tarif de site (marquage comme supprimé)
methods.delete = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID du tarif de site à supprimer

  try {
    // Marquer le tarif comme supprimé au lieu de le supprimer définitivement
    const result = await SiteTariffModel.findOneAndUpdate(
      { _id: id },
      { removed: true },  // Marque le tarif comme supprimé
      { new: true }  // Retourne la version mise à jour du document
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Tarif de site non trouvé ou déjà supprimé',
      });
    }

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Tarif de site marqué comme supprimé avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la suppression du tarif de site.',
      error: error.message,
    });
  }
};

module.exports = methods;
