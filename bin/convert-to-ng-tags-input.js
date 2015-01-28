(function () {
  var mongoose = require('mongoose')
  mongoose.connect('mongodb://localhost:27017/ExpTracker')
  require('../models/expenses')
  var Expense = mongoose.model('Expense')

  /* I want to convert tags which is an array 
   * into an array of objects with text: tag */

  // Define some testTags variables
  // Can delete this section once finished testing
  var testTagsSource = [ "tag1"
                       , "tag2"
                       , "tag3"
                       ]
    , testTagsDest = []
  
  // Take a string and make an object with field text: <string>
  convertToObject = function (text) {
    var tagObj = { "text" : "sampleTag" }

    tagObj.text = text
    return tagObj
  }

  // Take an array and for every item in it, call convert to Obj
  convertTags = function (sourceArray, destArray) {
    for (var i = 0; i < sourceArray.length; i++) {
      destArray.push(convertToObject(sourceArray[i]))
    };
  }

  // Grab all expenses from DB that don't have an ngTags field
  Expense.find( { "ngTags" : { "$exists" : false } }, function (err, expenses) {
    var newTags = []
      , expToSave = {}
      , oldRecordId = {}

    if (err) { console.log(err + ': error finding record') };
    
    // for each expense in the dataset
    expenses.forEach(function (element, index, array) {
      // Reset newTags to null array
      newTags = []

      // convert existing tags into objects
      convertTags(element.tags, newTags)

      // save new tags object into expense schema
      element.ngTags = newTags

      // Updating isn't working due to some strange "feature w/ schemas"
      // Save existing record schema ID and use it to delete the old
      // record after new ones have been created
      oldRecordId = element._id
      element._id = null

      // save exepense back into database
      expToSave = new Expense(element)
      expToSave.save(function () {
        if (err) { console.log(err + ': Error saving record') };

        console.log('Saved to DB: ' + expToSave)

        // now remove the prior entry in the db that doesn't have the new 
        // ngTags field -- Removing worked better in the 
        /*Expense.findByIdAndRemove(oldRecordId, function () {
          console.log('Old record removed: ' + oldRecordId)*/
        })

      })  
    })
  })
})()

/*// code to insert into mongodb client
db.expenses.find( { tags : "test" } ).forEach(function (doc) {
  ngTags = [ { "text" : "test"
             , "text" : "ngTag-test"
           } ];

  db.expenses.save(doc);
})*/