const Joi = require('joi');

const schema = Joi.object({
  number: Joi.string().required(),
  client: Joi.string().required(),
  contract: Joi.string().required(false),
  services: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().required(false),
        name: Joi.string().required(),
        numberOfAgents: Joi.number().required(),
        dailyRate: Joi.number().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        total: Joi.number().required()
      }).required(false)
    )
    .required(false),
  taxRate: Joi.number().required(false),
  taxName: Joi.string().required(false),
  status: Joi.string().required(false),
  startDate: Joi.date().required(false),
  endDate: Joi.date().required(false),
  notes: Joi.string().required(false),
  terms: Joi.string().required(false),
  conditions: Joi.string().required(false),
  subTotal: Joi.number().required(false),
  taxTotal: Joi.number().required(false),
  total: Joi.number().required(false),
  taxDetails: Joi.object().required(false),
  createdBy: Joi.string().required(false),
  approved: Joi.boolean().required(false),
  isExpired: Joi.boolean().required(false),
  converted: Joi.boolean().required(false),
  credit: Joi.number().required(false),
  discount: Joi.number().required(false),
  currency: Joi.string().required(false),
  pdf: Joi.string().required(false),
  files: Joi.array().required(false),
  updated: Joi.date().required(false),
  created: Joi.date().required(false)
});

module.exports = schema; 