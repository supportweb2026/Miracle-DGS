const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  tauxJournalier: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,  
    default: 'XAF',  
  },
  created: {
    type: Date,
    default: Date.now,
  },
  removed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Service', serviceSchema);
