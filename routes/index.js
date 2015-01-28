var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Expense = mongoose.model('Expense');
var moment = require('moment')

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Expense Tracker' });
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

	// console.log('dateStart - ' + dateStart.format() + ' : dateEnd - ' + dateEnd.format());
	query.exec(function (err, expenses) {
		if (err) { return next(err); };
		if (expenses.length === 0) {return next(new Error("No expenses in date range")); };

		req.expenses = expenses;
		return next();
	});
});

/* Create tag parameter in DB so when I define a URL with :tag in it this function will be run first */
router.param('tag', function (req, res, next, id) {
	var query = Expense.find({ tags : id });

	query.exec(function (err, expenses) {
		if (err) { return next(err); };
		if (!expenses) { return next(new Error("cannot find tag")); };

		req.expenses = expenses;
		return next();
	});
});

/* GET request for Monthly expenses */
router.get('/expenses/month/:month', function (req, res) {
	res.json(req.expenses)
});

/* GET request to /expenses/taglist */
/* Generating a list of tags on server side */
/* Placed above the GET at /expenses/:expense so it executes first */
router.get('/expenses/taglist', function (req, res, next) {
	var taglist = [];
	Expense.find(function (err, expenses) {
		if (err) { return next(err); };

		expenses.forEach(function (element, index, array) {
			element.tags.forEach(function (element, index, array) {
				if (taglist.indexOf(element) < 0 && element != '') {
					taglist.push(element);
					// console.log('element: ' + element + ' added to taglist');
				};
			});
		});
		
		// console.log('taglist: ' + taglist);
		taglist.sort();
		res.json(taglist);
	});
});

/* GET request to /expenses/ngtaglist */
/* Generates a list of ngTag objects on server side and accepts a query string */
/* That has the user input - used for autocomplete of ngTags */
router.get('/expenses/ngtaglist', function (req, res, next) {
	var ngTagList = []
	  , ngTag = {}
	  , taglist = []
	  , textEntered = req.query.text

	// recursive function to add to ngTagList array
	function makeNgTagList (legacyTagList) {
		if (!legacyTagList.length) { return res.json(ngTagList) };
		var legacyTag = legacyTagList.pop()

		if (legacyTag.search(textEntered) >= 0) {
			ngTagList.push( { text : legacyTag } )
		};
		makeNgTagList(legacyTagList)
	}


	// Copied code from GET at /expenses/taglist

	Expense.find(function (err, expenses) {
		if (err) { return next(err); };

		expenses.forEach(function (element, index, array) {
			element.tags.forEach(function (element, index, array) {
				if (taglist.indexOf(element) < 0 && element != '') {
					taglist.push(element);
				};
			});
		});
		
		taglist.sort()
		taglist.reverse()

		// end of copied code section

		// want a smart autocomplete list to pull up relevant tags
		makeNgTagList(taglist)

		// async causing problems... need to use recursion
		/*taglist.forEach(function (element, index, array) {
			if (element.search(textEntered) >= 0) {
				ngTag.text = element;
				ngTagList.push(ngTag);
			};
		});*/

		// res.json(ngTagList);
	});
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

/* GET request to /expenses/tag/:tag */
router.get('/expenses/tag/:tag', function (req, res) {
	res.json(req.expenses);
});


module.exports = router;
