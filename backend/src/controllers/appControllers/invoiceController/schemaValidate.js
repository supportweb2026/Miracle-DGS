/* SCHEMA DE VALIDATION JOI - TEMPORAIREMENT DÉSACTIVÉ
const Joi = require('joi');
const schema = Joi.object({
  client: Joi.alternatives().try(Joi.string(), Joi.object()).required(false),
  contract: Joi.string().required(false),
  number: Joi.number().required(false),
  year: Joi.number().required(false),
  status: Joi.string().required(false),
  notes: Joi.string().allow(''),
  date: Joi.date().required(false),
  startDate: Joi.date().required(false),
  endDate: Joi.date().required(false),
  // Services array
  services: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().optional(),
        siteTariffId: Joi.string().optional(),
        prestationId: Joi.string().optional(),
        siteId: Joi.string().optional(),
        prestationType: Joi.string().valid('site_specific', 'classic', 'legacy').optional(),
        numberOfAgents: Joi.number().optional(),
        dailyRate: Joi.number().optional(),
        numberOfDays: Joi.number().optional()
      }).unknown(true) // Permet tous les autres champs
    )
    .required(false),
  taxRate: Joi.alternatives().try(Joi.number(), Joi.string()).required(false),
  currency: Joi.string().required(false),
});
*/

// Schema vide pour éviter les erreurs
module.exports = {};
