// User input of year and month values to filter an ee.ImageCollection

// This module is required.
var date = require('users/gulandras90/inlandExcessWater:utils/dateFunctions');

// A factory function.
exports.dateInput = function (year, month) {
  // current year
  var currentYear = new Date().getFullYear();

  // get days in month
  var daysInMonth = date.getDaysInMonth(year, month);
  
  return {
    year: year,
    month: month,
    start: ee.Date(year + '-' + month + '-01'),
    finish: ee.Date(year + '-' + month + '-' + daysInMonth),
    daysInMonth: daysInMonth
  } || undefined;
};
