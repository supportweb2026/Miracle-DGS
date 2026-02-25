const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: true,  
  },
   category: {
     type: mongoose.Schema.ObjectId,
     ref: 'ExpenseCategory',
     required: true,
    autopopulate: true,
   },
  currency: {
    type: String,
    required: true,  
    default: 'XAF',  
  },
  total: {
    type: Number,
    required: true,  
  },
  description: {
    type: String,
    default: '',  
  },
  reference: {
    type: String,
      default: '', 
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
expenseSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Expense', expenseSchema);
