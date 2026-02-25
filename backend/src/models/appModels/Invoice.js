const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },

  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true }, // TEST: was required
  number: {
    type: Number,
    required: true, // TEST: was required
  },
  year: {
    type: Number,
    required: true, //    required: true,
  },
  content: String,
  recurring: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter'],
  },
  date: {
    type: Date,
    required: true, // TEST: was required
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  object: {
    type: String,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true, // TEST: was required
    autopopulate: true,
  },
  contract: {
    type: mongoose.Schema.ObjectId,
    ref: 'Contract',
    required: true, // TEST: was required
    autopopulate: true,
  },
  converted: {
    from: {
      type: String,
      enum: ['quote', 'offer'],
    },
    offer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Offer',
    },
    quote: {
      type: mongoose.Schema.ObjectId,
      ref: 'Quote',
    },
  },
  services: [
    {
      // Pour les services site_specific
      siteTariffId: {
        type: mongoose.Schema.ObjectId,
        ref: 'SiteTariff',
        autopopulate: true,
      },
      // Pour les services classic
      prestationId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Prestation',
        autopopulate: true,
      },
      siteId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Site',
        autopopulate: true,
      },
      // Type de prestation pour distinguer les deux cas
      prestationType: {
        type: String,
        enum: ['site_specific', 'classic', 'legacy'],
        default: 'legacy'
      },
      numberOfAgents: {
        type: Number,
        required: true, // TEST: was required
        min: 1,
      },
      numberOfDays: {
        type: Number,
        required: true, // TEST: was required
        min: 1,
      },
      dailyRate: {
        type: Number,
        required: true, // TEST: was required
      },
      total: {
        type: Number,
        required: true, // TEST: was required
      },
    },
  ],
  taxRate: {
    type: Number,
    default: 0,
  },
  subTotal: {
    type: Number,
    default: 0,
  },
  taxTotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'XAF',
    uppercase: true,
    required: true, // TEST: was required
  },
  credit: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  payment: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Payment',
    },
  ],
  paymentStatus: {
    type: String,
    default: 'unpaid',
    enum: ['unpaid', 'paid', 'partially'],
  },
  isOverdue: {
    type: Boolean,
    default: false,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'sent', 'refunded', 'cancelled', 'on hold'],
    default: 'draft',
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

// Validation personnalisée pour les services
invoiceSchema.pre('validate', function(next) {
  if (this.services && this.services.length > 0) {
    for (let service of this.services) {
      // Validation selon le type de prestation
      if (service.prestationType === 'site_specific') {
        if (!service.siteTariffId) {
          return next(new Error('siteTariffId est requis pour les services site_specific'));
        }
      } else if (service.prestationType === 'classic') {
        if (!service.prestationId || !service.siteId) {
          return next(new Error('prestationId et siteId sont requis pour les services classic'));
        }
      }
      // Pour les services legacy, on accepte soit siteTariffId soit prestationId
    }
  }
  next();
});

invoiceSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Invoice', invoiceSchema);
