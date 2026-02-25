const mongoose = require('mongoose');
const Model = mongoose.model('Taxes');
const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Taxes');

delete methods['delete'];

// Surcharger la méthode list pour retourner toutes les taxes (même désactivées)
methods.list = async (req, res) => {
  const sort = req.query.sort || 'desc';
  
  const result = await Model.find({
    removed: false,
  })
    .sort({ created: sort })
    .populate()
    .exec();

  if (result.length > 0) {
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(203).json({
      success: false,
      result: [],
      message: 'Collection is Empty',
    });
  }
};

methods.create = async (req, res) => {
  const { isDefault } = req.body;

  if (isDefault) {
    await Model.updateMany({}, { isDefault: false });
  }

  const countDefault = await Model.countDocuments({
    isDefault: true,
  });

  const result = await new Model({
    ...req.body,

    isDefault: countDefault < 1 ? true : false,
  }).save();

  return res.status(200).json({
    success: true,
    result: result,
    message: 'Requête créé avec succès',
  });
};

methods.delete = async (req, res) => {
  return res.status(403).json({
    success: false,
    result: null,
    message: "Vous ne pouvez pas supprimer une taxe après création",
  });
};

methods.update = async (req, res) => {
  const { id } = req.params;
  const tax = await Model.findOne({
    _id: req.params.id,
    removed: false,
  }).exec();
  const { isDefault = tax.isDefault, enabled = tax.enabled } = req.body;

  // if isDefault:false , we update first - isDefault:true
  // if enabled:false and isDefault:true , we update first - isDefault:true
  if (!isDefault || (!enabled && isDefault)) {
    await Model.findOneAndUpdate({ _id: { $ne: id }, enabled: true }, { isDefault: true });
  }

  // if isDefault:true and enabled:true, we update other taxes and make is isDefault:false
  if (isDefault && enabled) {
    await Model.updateMany({ _id: { $ne: id } }, { isDefault: false });
  }

  const taxesCount = await Model.countDocuments({});

  // if enabled:false and it's only one exist, we can't disable
  if ((!enabled || !isDefault) && taxesCount <= 1) {
    return res.status(422).json({
      success: false,
      result: null,
      message: 'You cannot disable the tax because it is the only existing one',
    });
  }

  const result = await Model.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
  });

  return res.status(200).json({
    success: true,
    message: 'Requête créé avec succès',
    result,
  });
};

module.exports = methods;
