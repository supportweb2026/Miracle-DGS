const mongoose = require('mongoose');
const ExpenseModel = mongoose.model('Expense');  // Le modèle de la dépense
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Expense');  // Création du CRUD pour "Expense"

// Supprimer la méthode de suppression si nécessaire (par exemple, si vous ne voulez pas permettre la suppression)
delete methods['delete'];  

// Méthode de création pour la dépense
methods.create = async (req, res) => {
  try {
    // Crée un nouveau document de dépense à partir des données envoyées dans la requête
    const expense = new ExpenseModel({
      ...req.body,  // Inclut les champs comme nom, category, devise, total, description, ref
    });

    const result = await expense.save();  // Sauvegarde du nouveau document

    return res.status(201).json({
      success: true,
      result: result,
      message: 'Requête créée avec succès',  // Message de succès
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the expense.',
      error: error.message,  // Message d'erreur si la création échoue
    });
  }
};

// Méthode de lecture pour obtenir toutes les dépenses
methods.readAll = async (req, res) => {
  try {
    //const expenses = await ExpenseModel.find({ removed: false });  // Filtrer les dépenses non supprimées
    const expenses = await ExpenseModel.find({ removed: false })
    //.lean()
    //.populate('category', 'categoryName')
    //.exec()
    ; 
    console.log('Expenses:');
    return res.status(200).json({
      success: true,
      result: expenses,
      message: 'Expenses fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching expenses.',
      error: error.message,
    });
  }
};

// Méthode de lecture pour obtenir une dépense spécifique
methods.readOne = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la dépense

  try {
    const expense = await ExpenseModel.findOne({ _id: id, removed: false });  // Trouve la dépense par son ID
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: expense,
      message: 'Expense fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the expense.',
      error: error.message,
    });
  }
};

// Méthode de mise à jour pour la dépense
methods.update = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la dépense à mettre à jour

  try {
    // Vérifie si la dépense existe et n'est pas marquée comme supprimée
    const expense = await ExpenseModel.findOne({
      _id: id,
      removed: false,
    }).exec();

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Met à jour la dépense avec les nouvelles données envoyées
    const result = await ExpenseModel.findOneAndUpdate(
      { _id: id },
      req.body,
      { new: true }  // Retourne la version mise à jour du document
    );

    return res.status(200).json({
      success: true,
      result: result,  // Données mises à jour
      message: 'Expense updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the expense.',
      error: error.message,
    });
  }
};

// Méthode de suppression de la dépense (optionnel si vous avez une logique particulière)
methods.delete = async (req, res) => {
  const { id } = req.params;  // Récupère l'ID de la dépense à supprimer

  try {
    // Marquer la dépense comme supprimée au lieu de la supprimer définitivement
    const result = await ExpenseModel.findOneAndUpdate(
      { _id: id },
      { removed: true },  // Marque la dépense comme supprimée
      { new: true }  // Retourne la version mise à jour du document
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or already removed',
      });
    }

    return res.status(200).json({
      success: true,
      result: result,
      message: 'Expense marked as removed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the expense.',
      error: error.message,
    });
  }
};

module.exports = methods;
