const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },

  converted: {
    type: Boolean,
    default: false,
  },
  number: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  content: String,
  date: {
    type: Date,
    required: true,
  },
  expiredDate: {
    type: Date,
    required: true,
  },

  prospect: {
    type: String,
    required: true,
  },
  prospectAddress: {
    type: String,
    required: false,
  },
  prospectPhone: {
    type: String,
    required: false,
  },

  contract: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contract',
    required: false,
    autopopulate: true,
  },

  // Remplacement de "items" par "services" avec référence
  services: [
    {
      name: {
        type: String,
        required: true,
      },
      startDate: {
        type: Date,
        required: false,
      },
      endDate: {
        type: Date,
        required: false,
      },
      dailyRate: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      numberOfAgents: {
        type: Number,
        required: true,
      },
      numberOfDays: {
        type: Number,
        required: true,
      },
    },
  ],
  
  taxName: {
    type: String,
    required: false,
  },
  taxRate: {
    type: Number,
  },
  taxDetails: {
    tva: Number,
    css: Number,
    tps: Number,
    tax: Number
  },
  subTotal: {
    type: Number,
  },
  taxTotal: {
    type: Number,
  },
  total: {
    type: Number,
  },
  credit: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'NA',
    uppercase: true,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'accepted', 'declined', 'cancelled', 'on hold'],
    default: 'draft',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
  pdf: {
    type: String,
  },
  files: [
    {
      id: String,
      name: String,
      path: String,
      description: String,
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
  ],
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

quoteSchema.plugin(require('mongoose-autopopulate')); // Pour activer l'autopopulation

module.exports = mongoose.model('Quote', quoteSchema);
