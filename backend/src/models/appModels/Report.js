const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  paymentStatus: {
    type: String,
    enum: ['all', 'paid_fully', 'paid_partially', 'unpaid'],
    required: true,
  },
  billingPeriod: {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Optionnel : tu peux garder trace de qui a demandé le rapport
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // si tu as un modèle utilisateur
  },
});

module.exports = mongoose.model('Report', reportSchema);
