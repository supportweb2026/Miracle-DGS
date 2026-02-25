const mongoose = require('mongoose');

const siteTariffSchema = new mongoose.Schema(
  {
    site: {
      type: mongoose.Schema.ObjectId,
      ref: 'Site',
      required: true,
      autopopulate: true,
    },
    prestation: {
      type: mongoose.Schema.ObjectId,
      ref: 'Prestation',
      required: true,
      autopopulate: true,
    },
    useCustomValues: {
      type: Boolean,
      default: false,
    },
    customDuration: {
      type: Number,
      min: 1,
      max: 24,
    },
    customHourlyRate: {
      type: Number,
      min: 0,
    },
    customDailyRate: {
      type: Number,
      min: 0,
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
siteTariffSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('SiteTariff', siteTariffSchema); 