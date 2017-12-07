/*global URI*/
/*eslint-env node, es6*/
/*eslint no-unused-vars:1*/
/*eslint no-console:0*/

// The caller function definition (it is called from the html file)
function getCourseContent() {
    var orgUnitId = 340995;

    // #1 -- get the array of contents
    function get1(get1Callback) {
        var contents = new Array();
        getToc(orgUnitId, function (err, tableOfContents) {
            for (var key in tableOfContents) {
                if (key === "Modules") {
                    contents = tableOfContents[key];
                }
            }
            get1Callback(contents);
        });
    }

    // #2 -- get the info
    function get2(get2Callback) {
        var info;
        getCourseInfo(orgUnitId, function (err, courseInfo) {
            info = courseInfo;
            get2Callback(info);
        });
    }

    // #3 -- (nested sequence of async calls finishes with the sync forEach at the bottom)
    // a)call the 1st async function and put its result into the array 
    var contentArray;
    get1(function (contents) {
        contentArray = contents;
        console.log('This is the content of the whole course:')
        console.log(contentArray);
        console.log('-----------------------------------------------------------------------');
        // b)call the 2nd async function and put its result into the object
        var infoObject;
        get2(function (info) {
            infoObject = info;
            // c)use the object and the array to call the TOCModule2TopicsList, 
            // get all items, put them into the array, restructure the array, and pass it to d3 method
            // all will be done in three steps:
            // I - get the data, II - restructure the data, III - make csv report

            // STEP I
            // this array will be restructured and passed to the d3 method for making the csv report
            var array_of_arrays = [];
            // this array will contain the column names (d2l module titles)
            var column_names = [];
            // these will be determined in the I step and used in the II step for restructuring the data
            var rows = 0;
            var columns = 0;
            // outside loop
            contentArray.forEach(function (topic) {
                // fill the array of column names
                column_names.push(topic.Title);
                // and get all the items of the course
                var topicsOut = TOCModule2TopicsList(topic, infoObject);

                var array_of_items = [];
                // temporary depth of every colum
                var colum_depth = 0;
                // inside loop : fill up the array_of_items -->
                topicsOut.forEach(function (item) {
                    array_of_items.push(item.title);
                    colum_depth++;
                });
                // --> and push it into the array_of_array as one element
                array_of_arrays.push(array_of_items);
                // handle the rows and colums lengthes (will be used in the step II)
                if (rows < colum_depth) {
                    rows = colum_depth;
                }
                columns++;
            });

            // STEP II
            // restructure the array_of_arrays making the array_of_objects fit for passing to d3.csvFormat
            var array_of_objects = [];
            for (var i = 0; i < rows; i++) {
                // make an object that fits the d3.csvFormat() method 
                var object = {};
                for (var j = 0; j < columns; j++) {
                    // just filling out the undefined elements
                    if (array_of_arrays[j][i] === undefined) {
                        array_of_arrays[j][i] = '   --   ';
                    }
                    // assign key - [column_names[]] : value - array_of_arrays[][]
                    object[column_names[j]] = array_of_arrays[j][i];
                }
                // stuck the object into the array that will be passed to d3.csvFormat()
                array_of_objects.push(object);
            }

            // STEP III
            // the final step -- make the csv report file
            var csv_report = d3.csvFormat(array_of_objects);
            console.log('This is the restructured content of the course. The csv file now has this form:');
            console.log(csv_report);
        });
    });
}
