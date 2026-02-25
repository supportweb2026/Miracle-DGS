const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Nom du site
   // trim: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  address: {
    type: String,
   required: true, // Adresse du site
   // trim: true,
  },
  city: {
    type: String,
    required: true, // Ville
   // trim: true,
  },
  country: {
    type: String,
    required: true,
    default: 'Gabon', // Pays fixé à Gabon
    //enum: ['Gabon'], // Évite les erreurs et assure la cohérence
  },
  nombre: {
    type: Number,
    default: 0, // Nombre d'employés par défaut
    min: 0,
  },
  removed: {
    type: Boolean,
    default: false, // Pour une suppression logique si besoin
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

siteSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Site', siteSchema);
