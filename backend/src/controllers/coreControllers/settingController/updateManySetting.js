const mongoose = require('mongoose');

const Model = mongoose.model('Setting');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { generate: uniqueId } = require('shortid');

const Admin = mongoose.model('Admin');
const AdminPassword = mongoose.model('AdminPassword');

const updateManySetting = async (req, res) => {
  // req/body = [{settingKey:"",settingValue}]
  let settingsHasError = false;
  const updateDataArray = [];
  const { settings } = req.body;
  console.log('Oui tizi on est ici merci');
  console.log('req=',req.body);
  //si on est dans le if merci
  const settingsObj = settings.reduce((acc, { settingKey, settingValue }) => {
    acc[settingKey] = settingValue;
    return acc;
  }, {});
  const { email, password, confirmPassword, firstName, lastName, role } = settingsObj;
console.log(':::::::',email,password,confirmPassword,firstName,lastName,role);
const isUserCreation =
  email && password && confirmPassword && firstName && lastName && role;
  if (isUserCreation) {

//validation des entrées
console.log('ici 000');
/*
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

const { error } = schema.validate(settingsObj);
console.log('ici 001');

if (error) {
  return res.status(400).json({
    success: false,
    errorMessage: error.details[0].message,
  });
}
console.log('ici 002'); */

 // Vérifier si l'email existe déjà
 const existingAdmin = await Admin.findOne({ email });
 if (existingAdmin) {
   return res.status(409).json({
     success: false,
     message: 'L\'email est déjà utilisé.',
   });
 }
   // ID unique pour le salt(valeur aléatoire) du mot de passe
   const salt = uniqueId();
   //hash pour le mot de passe
   const passwordHash = bcrypt.hashSync(salt + password, 10);
 const newAdmin = new Admin({
  email,
  name: firstName, // firstName du frontend devient name dans la DB
  surname: lastName, // lastName du frontend devient surname dans la DB
  role: role, // Utiliser le rôle sélectionné
  removed: false,
  enabled: true,
  created: new Date(),
});

await newAdmin.save();
const newAdminPassword = new AdminPassword({
  user: newAdmin._id,
  password: passwordHash,
  salt,
  emailVerified: true, // Reste à vérifier si email existe réellement avant passage à true..
});

await newAdminPassword.save();
return res.status(200).json({
  success: true,
  result: null, // exemple de directive côté frontend
  message: 'Utilisateur créé avec succès',
});
  }
  //
  for (const setting of settings) {
    if (!setting.hasOwnProperty('settingKey') || !setting.hasOwnProperty('settingValue')) {
      settingsHasError = true;
      break;
    }

    const { settingKey, settingValue } = setting;

    updateDataArray.push({
      updateOne: {
        filter: { settingKey: settingKey },
        update: { settingValue: settingValue },
      },
    });
  }

  if (updateDataArray.length === 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'No settings provided ',
    });
  }
  if (settingsHasError) {
    return res.status(202).json({
      success: false,
      result: null,
      message: 'Settings provided has Error',
    });
  }
  const result = await Model.bulkWrite(updateDataArray);

  if (!result || result.nMatched < 1) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No settings found by to update',
    });
  } else {
    return res.status(200).json({
      success: true,
      result: [],
      message: 'Mise à jour effectuée',
    });
  }
};

module.exports = updateManySetting;
