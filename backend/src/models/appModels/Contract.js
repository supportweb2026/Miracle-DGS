const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Prestation spécifique au site (optionnel)
  siteTariffId: {
    type: mongoose.Schema.ObjectId,
    ref: 'SiteTariff',
    required: false, // Maintenant optionnel
    autopopulate: true,
  },
  // Prestation classique (optionnel)
  prestationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Prestation',
    required: false, // Maintenant optionnel
    autopopulate: true,
  },
  // Site associé (requis pour toutes les prestations)
  site: {
    type: mongoose.Schema.ObjectId,
    ref: 'Site',
    required: true,
    autopopulate: true,
  },
  // Type de prestation pour distinguer les deux cas
  prestationType: {
    type: String,
    enum: ['classic', 'site_specific'],
    required: true,
    default: 'classic'
  },
  numberOfAgents: {
    type: Number,
    required: true,
    min: 1,
  },
  dailyRate: {
    type: Number,
    required: false,
  },
  hourlyRate: {
    type: Number,
    required: false,
  },
  duration: {
    type: Number,
    required: false,
  }
});

// Validation personnalisée pour s'assurer qu'au moins une prestation est définie
serviceSchema.pre('validate', function(next) {
  if (!this.siteTariffId && !this.prestationId) {
    this.invalidate('prestation', 'Au moins une prestation (classique ou spécifique au site) doit être définie');
  }
  if (this.siteTariffId && this.prestationId) {
    this.invalidate('prestation', 'Une prestation ne peut pas être à la fois classique et spécifique au site');
  }
  next();
});

const contractSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  paymentMode: {
    type: mongoose.Schema.ObjectId,
    ref: 'PaymentMode',
    required: true,
    autopopulate: true,
  },
  services: [serviceSchema],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  reference: {
    type: String,
    default: '',
  },
  siret: {
    type: String,
    required: true,
    unique: true,
  },
  representativeName: {
    type: String,
    required: true,
  },
  rib: {
    type: String,
    default: '',
  },
  banque: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['actif', 'suspendu', 'en_attente', 'resilie'],
    default: 'actif',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  removed: {
    type: Boolean,
    default: false,
  }
});

contractSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Contract', contractSchema);
