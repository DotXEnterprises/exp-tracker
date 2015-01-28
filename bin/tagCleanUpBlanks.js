(function() {
	var mongoose = require('mongoose');
	mongoose.connect('mongodb://localhost:27017/ExpTracker');
	require('../models/expenses');
	var Expense = mongoose.model('Expense');

	console.log('connected to DB and initialized');
	var blankTags = 1; /* Assume blank tags exist to start */

	Expense.find({ tags : '' }, function (err, data) {
		if (err) { console.log(err + ': error searching database'); };
		if (!data) {
			console.log('No blank tags found'); 
			blankTags = 0;
			process.exit;
		};
		console.log(data.length + ' objects returned with blank tags');
		console.log(data);


		data.forEach(function (element, index, array) {
			while(element.tags.indexOf('') >= 0) {
				element.tags.splice(element.tags.indexOf(''),1);
			};
			Expense.findById(element._id, function (err, expense) {
				console.log('expense - ' + expense.tags);
				console.log('element - ' + element.tags);
				expense.tags = element.tags;
				expense.save(function (err, expense, numAffected) {
					if (err) { console.log(err)};
					console.log(numAffected + ' record(s) updated')
				});

			});
		});
	});
})();


