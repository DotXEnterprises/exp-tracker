var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Expense = mongoose.model('Expense');
var Credit = mongoose.model('Credit'); // added to include credits 
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

/* GET /credit */
/* copied and changed from directly above */
router.get('/credits', function (req, res, next) {
	Credit.find(function (err, credits) {
		if (err) {return next(err); };
		
		res.json(credits);
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

/*POST /credits */
/* copied and changed from directly above */
router.post('/credits', function (req, res, next) {
	var credit = new Credit(req.body);
	credit.save(function (err, credit) {
		if (err) {return next(err); };
		
		res.json(credit);
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

/* Create credit parameter in DB so when I define a URL with :credit in it this function will be run first */
/* copied and changed from directly above */
router.param('credit', function (req, res, next, id) {
	var query = credit.findById(id);

	query.exec(function (err, credit) {
		if (err) { return next(err); };
		if (!credit) { return next(new Error("cannot find Credit")); };

		req.credit = credit;
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

/* Create month parameter in DB so when I define a URL with :month in it this function will be run first*/
/* eg. a GET request at /credit/month/2015-01-01  (copied and changed from directly above)*/
router.param('month', function (req, res, next, dateInputTxt) {
	var dateInput = moment(dateInputTxt);
	var dateStart = moment({y: dateInput.year(), M: dateInput.month(), d: 1});
	var dateEnd = moment(dateStart);
	dateEnd.add(1,'months');

	var query = Credit.find({ "dateIncurred" : {"$gte": dateStart.toDate(), "$lt": dateEnd.toDate()} });

	// console.log('dateStart - ' + dateStart.format() + ' : dateEnd - ' + dateEnd.format());
	query.exec(function (err, credits) {
		if (err) { return next(err); };
		if (credits.length === 0) {return next(new Error("No creditss in date range")); };

		req.credits = credits;
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

/* Create tag parameter in DB so when I define a URL with :tag in it this function will be run first */
/* copied and changed from directly above */
router.param('tag', function (req, res, next, id) {
	var query = Credit.find({ tags : id });

	query.exec(function (err, credits) {
		if (err) { return next(err); };
		if (!credits) { return next(new Error("cannot find tag")); };

		req.credits = credits;
		return next();
	});
});

/* GET request for Monthly expenses */
router.get('/expenses/month/:month', function (req, res) {
	res.json(req.expenses)
});

/*GET request for Monthly credits */
/* copied and changed from directly above */
router.get('/credits/month/:month', function (req, res) {
	res.json(req.credits)
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

/* GET request to /credits/taglist */
/* Generating a list of tags on server side */
/* Placed above the GET at /credits/:credits so it executes first */
/* Copied from above and changed to include credits */
router.get('/credits/taglist', function (req, res, next) {
	var taglist = [];
	Credit.find(function (err, credits) {
		if (err) { return next(err); };

		credits.forEach(function (element, index, array) {
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

/* GET request to /credits/ngtaglist */
/* Generates a list of ngTag objects on server side and accepts a query string */
/* That has the user input - used for autocomplete of ngTags */
/* Copied from above and changed to include credits */
router.get('/credits/ngtaglist', function (req, res, next) {
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


	// Copied code from GET at /credits/taglist

	Expense.find(function (err, credits) {
		if (err) { return next(err); };

		credits.forEach(function (element, index, array) {
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

/* GET for a single credit at /credits/:credits */
router.get('/credits/:credits', function (req, res) {
	res.json(req.credit);
});

/* DELETE request for single expense at /expenses/:expense */
router.delete('/credits/:credit', function (req, res, next) {
	var query = Credit.findByIdAndRemove(req.credit._id);

	console.log('DELETE request received at /credit/' + req.credit._id)
	query.exec(function (err, credit) {
		if (err) { return next(err); };
		if (!credit) { return next(new Error("Could not find credit record to delete")); };

		res.json(credit);
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

/* PUT request for /credits/:credits */
/* Copied from above and changed to include credits */
router.put('/credits/:credit', function (req, res, next) {
	var query = Credit.findByIdAndUpdate(req.credit._id, req.body, function (err, credit) {
		if (err) { return next(err); };
		if (!credit) { return next(new Error("Could not find credit record to update")); };

		res.json(credit);
	});
});

/* GET request to /expenses/tag/:tag */
router.get('/expenses/tag/:tag', function (req, res) {
	res.json(req.expenses);
});

/* GET request to /credit/tag/:tag */
/* Copied from above and changed to include credits */
router.get('/credits/tag/:tag', function (req, res) {
	res.json(req.credits);
});

module.exports = router;
