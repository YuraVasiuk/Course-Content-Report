/*eslint-env node, es6*/
/*eslint no-unused-vars:1*/
/*eslint no-console:0*/

var module1 = require('./module1.js'),
    module2 = require('./module2.js');

module1(function () {
    console.log('Module 1 function call');
});

module2(function () {
    console.log('Module 2 function call');
});
