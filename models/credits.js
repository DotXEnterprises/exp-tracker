var mongoose = require('mongoose');

var CreditsSchema = new mongoose.Schema( { paidFrom: String
                                         , tags: Array
                                         , amount: Number
                                         , memo: String
                                         , dateIncurred: Date
                                         , dateEntered: Date
                                         , entrySource: String
                                         , transactionType: String
                                         , ngTags: Array
});

mongoose.model('Credits', CreditsSchema);
