var mongoose = require('mongoose');

var ExpenseSchema = new mongoose.Schema({
	importance: String,
	paidTo: String,
	tags: Array,
	amount: Number,
	memo: String,
	dateIncurred: Date,
	dateEntered: Date,
	entrySource: String,
	transactionType: String
});

mongoose.model('Expense', ExpenseSchema);