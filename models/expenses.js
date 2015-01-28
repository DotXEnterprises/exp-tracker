var mongoose = require('mongoose');

var ExpenseSchema = new mongoose.Schema( { importance: String
	                                       , paidTo: String
                                         , tags: Array
                                         , amount: Number
                                         , memo: String
                                         , dateIncurred: Date
                                         , dateEntered: Date
                                         , entrySource: String
                                         , transactionType: String
                                         , ngTags: Array
});

mongoose.model('Expense', ExpenseSchema);