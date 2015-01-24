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

	app.controller('MonthlyExpenseController', ['$http', '$log', function ($http,$log) {
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
	}]);

	app.directive('expenseDetail', function() {
		return {
			restrict: 'E',
			templateUrl: '/templates/expense-detail.html',
			controller: function ($http,$log) {
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