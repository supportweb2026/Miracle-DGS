const Contract = require('../../../models/appModels/Contract');
const Counter = require('../../../models/appModels/Counter');
const Setting = require('../../../models/coreModels/Setting');

const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Contract');

// Méthode de création personnalisée
methods.create = async (req, res) => {
  try {
    const { number, year } = req.body;
    
    // Vérifier si le numéro de contrat existe déjà pour cette année
    const currentYear = year || new Date().getFullYear();
    console.log('🔍 Vérification doublon contrat - Numéro:', number, 'Année:', currentYear);
    
    const existingContract = await Contract.findOne({ 
      number: number, 
      $or: [
        { year: currentYear },
        { year: { $exists: false } }
      ],
      removed: false 
    });
    
    console.log('🔍 Contrat existant trouvé:', existingContract ? 'OUI' : 'NON');
    
    if (existingContract) {
      console.log('❌ ERREUR: Contrat numéro', number, '/', currentYear, 'existe déjà - CRÉATION BLOQUÉE');
      return res.status(400).json({
        success: false,
        message: `Un contrat avec le numéro ${number}/${currentYear} existe déjà. Veuillez choisir un autre numéro.`
      });
    }
    
    console.log('✅ Aucun doublon trouvé - Création autorisée');
    
    // Vérifier si le SIRET existe déjà
    const { siret } = req.body;
    if (siret) {
      console.log('🔍 Vérification doublon SIRET - SIRET:', siret);
      
      const existingContractBySiret = await Contract.findOne({ 
        siret: siret,
        removed: false 
      });
      
      console.log('🔍 Contrat existant avec ce SIRET trouvé:', existingContractBySiret ? 'OUI' : 'NON');
      
      if (existingContractBySiret) {
        console.log('❌ ERREUR: SIRET', siret, 'déjà utilisé - CRÉATION BLOQUÉE');
        return res.status(400).json({
          success: false,
          message: `Le SIRET ${siret} est déjà utilisé par un autre contrat. Veuillez vérifier le numéro SIRET.`
        });
      }
      
      console.log('✅ SIRET unique - Création autorisée');
    }
    
    // Créer le nouveau contrat avec le numéro du formulaire
    const contract = await Contract.create({
      ...req.body
    });

    // Mettre à jour last_contract_number dans les settings avec le numéro du contrat créé
    await Setting.findOneAndUpdate(
      { settingKey: 'last_contract_number' },
      { $set: { settingValue: contract.number } },
      { new: true }
    );

    console.log('✅ Contrat créé avec succès - ID:', contract._id, 'Numéro:', contract.number);

    return res.status(201).json({
      success: true,
      result: contract,
      message: 'Contrat créé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la création du contrat:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la création du contrat',
      error: error.message
    });
  }
};

// Méthode de lecture pour obtenir tous les contrats
methods.readAll = async (req, res) => {
  try {
    // Filtrer les contrats non supprimés
    const contracts = await Contract.find({ removed: false }).exec();
    return res.status(200).json({
      success: true,
      result: contracts,
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

// Méthode de lecture pour obtenir un contrat spécifique
methods.readOne = async (req, res) => {
  const { id } = req.params;

  try {
    const contract = await Contract.findOne({ _id: id, removed: false });
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé',
      });
    }

    return res.status(200).json({
      success: true,
      result: contract,
      message: 'Contrat récupéré avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la récupération du contrat.',
      error: error.message,
    });
  }
};

// Méthode de mise à jour pour le contrat
methods.update = async (req, res) => {
  const { id } = req.params;

  try {
    const contract = await Contract.findOne({ _id: id, removed: false }).exec();

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé',
      });
    }

    const result = await Contract.findOneAndUpdate(
      { _id: id },
      req.body,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Contrat mis à jour avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la mise à jour du contrat.',
      error: error.message,
    });
  }
};

// Méthode de suppression du contrat
methods.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Contract.findOneAndUpdate(
      { _id: id },
      { removed: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Contrat non trouvé ou déjà supprimé',
      });
    }

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Contrat marqué comme supprimé avec succès',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la suppression du contrat.',
      error: error.message,
    });
  }
};

module.exports = methods;
