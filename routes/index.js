var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Expense = mongoose.model('Expense');
var moment = require('moment')

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'ExpTracker' });
});

/* GET /expenses */
router.get('/expenses', function (req, res, next) {
	Expense.find(function (err, expenses) {
		if (err) { return next(err); };
		
		res.json(expenses);
	});
});

/* POST /expenses */
router.post('/expenses', function (req, res, next) {
	var expense = new Expense(req.body);
	expense.save(function (err, expense) {
		if (err) { return next(err); };

		res.json(expense);
	});
});

/* Create expense parameter in DB so when I define a URL with :expense in it this function will be run first */
router.param('expense', function (req, res, next, id) {
	var query = Expense.findById(id);

	query.exec(function (err, expense) {
		if (err) { return next(err); };
		if (!expense) { return next(new Error("cannot find expense")); };

		req.expense = expense;
		return next();
	});
});

/* Create month parameter in DB so when I define a URL with :month in it this function will be run first*/
/* eg. a GET request at /expenses/month/2015-01-01*/
router.param('month', function (req, res, next, dateInputTxt) {
	var dateInput = moment(dateInputTxt);
	var dateStart = moment({y: dateInput.year(), M: dateInput.month(), d: 1});
	var dateEnd = moment(dateStart);
	dateEnd.add(1,'months');

	var query = Expense.find({ "dateIncurred" : {"$gte": dateStart.toDate(), "$lt": dateEnd.toDate()} });

	console.log('dateStart - ' + dateStart.format() + ' : dateEnd - ' + dateEnd.format());
	query.exec(function (err, expenses) {
		if (err) { return next(err); };
		if (expenses.length === 0) {return next(new Error("No expenses in date range")); };

		req.expenses = expenses;
		return next();
	});
});

router.get('/expenses/month/:month', function (req, res) {
	res.json(req.expenses)
});

/* GET for a single expense at /expenses/:expense */
router.get('/expenses/:expense', function (req, res) {
	res.json(req.expense);
});

/* DELETE request for single expense at /expenses/:expense */
router.delete('/expenses/:expense', function (req, res, next) {
	var query = Expense.findByIdAndRemove(req.expense._id);

	console.log('DELETE request received at /expenses/' + req.expense._id)
	query.exec(function (err, expense) {
		if (err) { return next(err); };
		if (!expense) { return next(new Error("Could not find expense record to delete")); };

		res.json(expense);
	});
});

/* PUT request for /expenses/:expense */
router.put('/expenses/:expense', function (req, res, next) {
	var query = Expense.findByIdAndUpdate(req.expense._id, req.body, function (err, expense) {
		if (err) { return next(err); };
		if (!expense) { return next(new Error("Could not find expense record to update")); };

		res.json(expense);
	});
});


module.exports = router;
