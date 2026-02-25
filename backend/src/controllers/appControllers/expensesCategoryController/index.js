const mongoose = require('mongoose');
const Model = mongoose.model('ExpenseCategory');  
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('ExpenseCategory');  // On crée un CRUD pour "ExpenseCategory"

delete methods['delete'];  // On garde pas l'option delete pour cette ressource (comme dans Taxes)

methods.create = async (req, res) => {
  // On n'a pas de champs supplémentaires comme 'isDefault' ou 'enabled', donc pas de logique supplémentaire ici
  const result = await new Model({
    ...req.body,  // Cela va inclure les champs comme categoryName, categoryDescription, categoryColor
  }).save();

  return res.status(200).json({
    success: true,
    result: result,
    message: 'Expense Category created successfully',  // Message de succès
  });
};

methods.delete = async (req, res) => {
  return res.status(403).json({
    success: false,
    result: null,
    message: "You can't delete an expense category after it has been created",  // Message d'interdiction de suppression
  });
};

methods.update = async (req, res) => {
  const { id } = req.params;  // On récupère l'ID de la catégorie d'expense à mettre à jour
  const expenseCategory = await Model.findOne({
    _id: id,
    removed: false,  // Vérifie que la catégorie n'est pas marquée comme supprimée
  }).exec();

  if (!expenseCategory) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Expense Category not found',
    });
  }

  // Mise à jour des données
  const result = await Model.findOneAndUpdate({ _id: id }, req.body, {
    new: true,  // On retourne le document mis à jour
  });

  return res.status(200).json({
    success: true,
    message: 'Expense Category updated successfully',
    result,  // Données mises à jour
  });
};

module.exports = methods;
