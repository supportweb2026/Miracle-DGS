const createCRUDController = require('../../../controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Quote');

const create = require('./create');
const summary = require('./summary');
const update = require('./update');
const convertQuoteToInvoice = require('./convertQuoteToInvoice');
const paginatedList = require('./paginatedList');
const read = require('./read');

methods.list = paginatedList;
methods.read = read;
methods.readOne = read;

methods.create = create;
methods.update = update;
methods.convert = convertQuoteToInvoice;
methods.summary = summary;

module.exports = methods;
