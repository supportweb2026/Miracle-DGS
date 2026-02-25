const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Invoice');

const create = require('./create');
const summary = require('./summary');
const update = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');
const read = require('./read');

methods.create = create;
methods.update = update;
methods.delete = remove;
methods.summary = summary;
methods.list = paginatedList;
methods.read = read;
methods.readOne = read;

module.exports = methods;
