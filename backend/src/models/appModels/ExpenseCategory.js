const mongoose = require('mongoose');

const expensecategoriesschema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  categoryName: {
    type: String,
    required: true,  // Le nom de la catégorie est requis
  },
  categoryDescription: {
    type: String,  // La description est une chaîne de texte
    default: '',  // Valeur par défaut vide
  },
  categoryColor: {
    type: String,  // La couleur est une chaîne de texte (souvent un code hexadécimal ou une couleur CSS)
    required: true,  // La couleur est obligatoire
  },
  created: {
    type: Date,
    default: Date.now,  // La date de création est automatiquement définie à la date actuelle
  },
});
module.exports = mongoose.model('ExpenseCategory', expensecategoriesschema);
