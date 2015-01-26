(function () {
	var app = angular.module('expTracker', ['angularMoment']);
	var tracker = {};

	app.controller('TrackerController', ['$http', '$log', function ($http,$log) {
		tracker = this;
		tracker.expenses = [];
		
		$http.get('/expenses').success(function (data) {
			tracker.expenses = data;
		});
	}]);

	app.controller('TabController', function () {
		this.tab = 1;

		this.setTab = function (newValue) {
			this.tab = newValue;
		};

		this.isSet = function (tabName) {
			return this.tab === tabName;
		};
	});

	app.controller('ReviewTabController', function () {
		this.reviewTab = 0;

		this.setTab = function (newValue) {
			this.reviewTab = newValue;
		};

		this.isSet = function (tabName) {
			return this.reviewTab === tabName;
		};
	});

	app.controller('TagsController', ['$http', '$log', function ($http,$log){
		var tags = this;
		tags.tagList = [];
		tags.expenseList = [];
		tags.expenseListTotal = 0;

		this.tagsInit = function (cb) {
			// Initialize tags.tagList
			$http.get('/expenses/taglist').success(function (data) {
				if (!data) { return new Error('Error getting tag list'); };

				data.forEach(function (element, index, array) {
					var tag = {};
					tag.name = element;
					tag.status = false;
					tag.activeTag = false;

					tags.tagList.push(tag);
				});
				$log.log('tagsInit Function')
				$log.log(tags.tagList);

				cb();
			});
		};
		
		this.tagsInit(function () {});

		this.loadTag = function(tagToSet) {
			// tags.tagsInit(function () {
				tags.setStatus(tagToSet, false);
			// });
		};

		this.setStatus = function(tagToSet, clickFlag) {
			tags.tagList.forEach(function (element, index, array) {
				if (element.name === tagToSet && element.status === false) {
					element.status = true;
					if (!clickFlag) { element.activeTag = true; };
				} else {
					if (element.name === tagToSet && element.status === true) {
						element.status = false;
						if (!clickFlag) { element.activeTag = false; };
					};
				};

				$log.log('Name: ' + element.name + ' - status: ' + element.status);
			});
			tags.onChange();
		};

		this.onChange = function () {
			tags.expenseList = [];
			tags.expenseListTotal = 0;
			var newTagList = [];

			// Want to update tags.tagList to pull in new tags, but not lose status of any active
			$http.get('/expenses/taglist').success(function (data) {
				if (!data) { return new Error('Error getting tag list'); };

				// grab new taglist as data and for each entry, we want to first look 
				// for an entry in the prior list, otherwise set status to 0 and then save it effective list
				data.forEach(function (element, index, array) {
					var tag = {};
					for (var i = tags.tagList.length - 1; i >= 0; i--) { /* is there already a match? */
						if (tags.tagList[i].name === element) {
							tag = tags.tagList[i];
						};
					};
					if (!tag.name) { /* if we didn't find a match in the current tags.tagList*/
						tag.name = element;
						tag.status = false;
					};

					newTagList.push(tag); /* add the tag to the newTagList*/
				});

				tags.tagList = newTagList; /* copy the newTagList as the working tags.tagList */
				$log.log(tags.tagList.length)
				// for each tag in taglist, we want to add the relevant expenses into tags.expenseList
				tags.tagList.forEach(function (element, index, array) {
					// $log.log('Name: ' + element.name + ' - status: ' + element.status);
					if (element.status) {
						$http.get('/expenses/tag/' + element.name).success(function (expenses) {
							if(!expenses) { $log.log('No expenses found for tag'); };
							// var safeToAdd = true;
							if (expenses.length > 0) { /* if we have more than one expense, we want to add each one */
								expenses.forEach(function (element, index, array) {
									// Reset safeToAdd for next expense
									safeToAdd = true;
									$log.log(element);
									
									/* if expense doesn't already exist in tags.expenseList */
									for (var i = tags.expenseList.length - 1; i >= 0; i--) {
										if (tags.expenseList[i]._id === element._id) {
											safeToAdd = false;
										};
									};

									$log.log(element._id + ' : ' + safeToAdd);
									if (safeToAdd) {
										tags.expenseList.push(element);
										tags.expenseListTotal += element.amount;
									}; 
								});
							} else { /* only one expense */

								/* if expense doesn't already exist in tags.expenseList */
								for (var i = tags.expenseList.length - 1; i >= 0; i--) {
									if (tags.expenseList[i]._id === expenses._id) {
										safeToAdd = false
									};
								};

								$log.log(expenses._id + ' : ' + safeToAdd);
								if (safeToAdd) {
										tags.expenseList.push(expenses);
										tags.expenseListTotal += expenses.amount;
									};
							};
						});
					};
				});
			});
		};

	}]);

	app.directive('monthlyExpenseDetail', function () {
		return {
			restrict: 'E',
			templateUrl: '/templates/monthly-expense-detail.html',
			controller: function ($http,$log) {
				var monthly = this;
				var curMonth = moment();


				monthly.expenses = [];
				monthly.detailExpense = {};
				curMonth = moment({y: curMonth.year(), M: curMonth.month(), d: 1});
				monthly.dateString = curMonth.format('YYYY-MM-DD');
				monthly.headerString = 'Current Month';
				

				this.refresh = function () {
					monthly.expenses = [];
					monthly.totalExpenses = 0;
					

					$http.get('/expenses/month/' + monthly.dateString).success(function (data) {
						monthly.expenses = data;

						// calculate monthly total
						monthly.expenses.forEach(function (element, index, array) {
							monthly.totalExpenses += element.amount;
						});
					});

					
				};

				// pass in 'Current' or 'Prior' to set month to dispaly
				this.loadMonth = function (monthString) {
					var displayMonth = moment(curMonth);

					if (monthString === 'Current') {
						monthly.dateString = displayMonth.format('YYYY-MM-DD');
						monthly.headerString = 'Current Month';
						monthly.refresh();
					};

					if (monthString === 'Prior') {
						monthly.dateString = displayMonth.subtract(1,'month').format('YYYY-MM-DD');
						monthly.headerString = 'Prior Month';
						monthly.refresh();	
					};
				};

				this.detail = function (id) {
					$log.log(id);
					$http.get('/expenses/' + id).success(function (data) {
						monthly.detailExpense = data;
						monthly.detailExpense.tagsInput = '';
						monthly.detailExpense.dateInput =  moment(monthly.detailExpense.dateIncurred).toDate();
						monthly.detailExpense.tags.forEach(function (element, index, array) {
							monthly.detailExpense.tagsInput += (element + ' ');
						});
						monthly.detailExpense.allowDelete = 0;
						$log.log(monthly.detailExpense);
					});
				};

				this.deleteExpense = function (id) {
					$log.log('Deleting : ' + id);
					$http.delete('/expenses/' + id).success(function (data) {
						// this is sloppy but I am pulling the recent added history from the global tracker variable and have to update it after every change
						$http.get('/expenses').success(function (data) {
							tracker.expenses = data;
							monthly.refresh();
						});
					});
				};

				this.editExpense = function (id) {
					$log.log('Editing record: ' + id);
					
					// transform dateIncurred and tags from form values
					monthly.detailExpense.tags = monthly.detailExpense.tagsInput.split(' ');
					while(monthly.detailExpense.tags.indexOf('') >= 0) {
						// element.tags.splice(element.tags.indexOf(''),1);
						monthly.detailExpense.tags.splice(monthly.detailExpense.tags.indexOf(''),1);
					};
					// monthly.detailExpense.tags.splice(monthly.detailExpense.tags.indexOf(''),1);
					$log.log(monthly.detailExpense.tags);
					monthly.detailExpense.dateIncurred = moment(monthly.detailExpense.dateInput).toDate();
					monthly.detailExpense.amount = Number(monthly.detailExpense.amount);
					$log.log(monthly.detailExpense);
					$http.put('/expenses/' + id, monthly.detailExpense).success(function (data) {
						$log.log('Success - ' + data);
						$http.get('/expenses').success(function (data) {
							tracker.expenses = data;
							monthly.refresh();
						});
					});
				};

				monthly.refresh();
			},
			controllerAs: 'monthlyExp'
		};
	});

	app.directive('expenseDetail', function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/expense-detail.html',
			controller: function ($http,$log) {
				expDetCtrl = this;
				this.show = 0;
				this.showEdit = 0;
				this.expense = {};

				this.onClick = function (expenseToShow) {
					if (this.expense === expenseToShow) {
						this.show = 0;
						this.expense = {};
					} else {
						this.show = 1;
						this.expense = expenseToShow;
					};
				};

				this.isActive = function (expenseToCheck) {
					return this.expense === expenseToCheck;
				};

				this.deleteExpense = function (tracker) {
					var expenseToDelete = this.expense;
					var expenseDetail = this;

					// send DELETE request
					$http.delete('/expenses/' + expenseToDelete._id).success(function () {
						expenseDetail.show = 0;
						expenseDetail.expense = {};
						// send a new GET request to get the updated dataset
						// this is sloppy but I am pulling the recent added history from the global tracker variable and have to update it after every change
						$http.get('/expenses').success(function (data) {
							tracker.expenses = data;
							
						});

					});
				};
				this.detail = function (id) {
					$log.log(id);
					$http.get('/expenses/' + id).success(function (data) {
						expDetCtrl.expense = data;
						expDetCtrl.expense.tagsInput = '';
						expDetCtrl.expense.dateInput =  moment(expDetCtrl.expense.dateIncurred).toDate();
						expDetCtrl.expense.tags.forEach(function (element, index, array) {
							expDetCtrl.expense.tagsInput += (element + ' ');
						});
						expDetCtrl.expense.allowDelete = 0;
						$log.log(expDetCtrl.expense);
					});
				};

				this.editExpense = function (id) {
					$log.log('Editing record: ' + id);
					
					// transform dateIncurred and tags from form values
					this.expense.tags = this.expense.tagsInput.split(' ');
					while(this.expense.tags.indexOf('') >= 0) {
						// element.tags.splice(element.tags.indexOf(''),1);
						this.expense.tags.splice(this.expense.tags.indexOf(''),1);
					};
					// this.expense.tags.splice(this.expense.tags.indexOf(''),1);
					$log.log(this.expense.tags);
					this.expense.dateIncurred = moment(this.expense.dateInput).toDate();
					this.expense.amount = Number(this.expense.amount);
					$http.put('/expenses/' + id, this.expense).success(function (data) {
						$log.log('Success - ' + data);
						$http.get('/expenses').success(function (data) {
							tracker.expenses = data;
						});
					});
				};

			},
			controllerAs: "expDetCtrl"
		};
	});

	app.directive('expenseForm', function() {
		return {
			restrict: "E",
			templateUrl: "/templates/expense-form.html",
			controller: function ($http,$log) {
				this.expense = {};
				this.expense.tagsInput = '';

				// $log.log(this.today)

				this.addExpense = function (tracker) {
					this.expense.dateEntered = Date.now();
					this.expense.amount = Number(this.expense.amount);
					this.expense.tags = this.expense.tagsInput.split(' ');
					while(this.expense.tags.indexOf('') >= 0) {
						// element.tags.splice(element.tags.indexOf(''),1);
						this.expense.tags.splice(this.expense.tags.indexOf(''),1);
					};
					this.expense.entrySource = 'web-app';

					// send the data to the server
					$http.post('/expenses', this.expense).success(function (data) {
						// $log.log(data);
						// pull the data back from the server and store it into array
						// this is sloppy but I am pulling the recent added history from the global tracker variable and have to update it after every change
						$http.get('/expenses').success(function (data) {
							tracker.expenses = data;
							$log.log(tracker);
						});
					});

					// reset form
					this.expense = {};
				};
			},
			controllerAs: "expenseCtrl"
		};
	});
})();