const mongoose = require('mongoose');

// Définir le schéma de prestation
const prestationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,  // Nom de la prestation
  },
  description: {
    type: String,
    required: false, // Description de la prestation
  },
  baseDuration: {
    type: Number,
    required: true,
    min: 1, // Durée minimale de la prestation (en heures)
    max: 24, // Durée maximale (en heures)
  },
  baseHourlyRate: {
    type: Number,
    required: true,
    min: 0, // Tarif horaire
  },
  baseDailyRate: {
    type: Number,
    required: true,
    min: 0, // Tarif journalier
  },
  
  created: {
    type: Date,
    default: Date.now,  
  },

  removed: {
    type: Boolean,
    default: false, // Indique si la prestation est supprimée
  },
  
  // Date de création personnalisée si nécessaire (sans utiliser timestamps)
  created: {
    type: Date,
    default: Date.now,
  }
});

// Exporter le modèle
module.exports = mongoose.model('Prestation', prestationSchema);
