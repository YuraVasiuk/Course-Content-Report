/*eslint-env node, browser*/
/*eslint no-console:0, no-unused-vars:0, no-undef:02*/
/*global URI*/

/*
Dependencies that need to be on the page
    URI.js
        site: https://medialize.github.io/URI.js/
        github: https://github.com/medialize/URI.js
        cdn: https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.10/URI.min.js
*/


/*********************************************
 * function that makes request error objs for the functions below
 **********************************************/
function makeRequestErrorObj(request) {
    return {
        status: request.status,
        statusText: request.statusText,
        responseText: request.responseText,
        responseURL: request.responseURL
    }
}


/*********************************************
 * 1 Retrieve table of contents for the specified orgUnitId 
 * http://docs.valence.desire2learn.com/res/content.html#get--d2l-api-le-(version)-(orgUnitId)-content-toc
 **********************************************/
function getToc(orgUnitId, getTocCallback) {
    var tocxhr = new XMLHttpRequest();
    tocxhr.open("GET", "/d2l/api/le/1.26/" + orgUnitId + "/content/toc")
    tocxhr.onload = function () {
        if (tocxhr.status == 200) {
            getTocCallback(null, JSON.parse(tocxhr.response));
        } else {
            getTocCallback(makeRequestErrorObj(tocxhr), null);
        }

    }
    tocxhr.send();
}

/*********************************************
 * 2 This function makes the course info valence call 
 * http://docs.valence.desire2learn.com/res/course.html#get--d2l-api-lp-(version)-courses-(orgUnitId)
 **********************************************/
function getCourseInfo(orgUnitId, getcourseInfoCallback) {
    var pathxhr = new XMLHttpRequest();
    pathxhr.open("GET", "/d2l/api/lp/1.15/courses/" + orgUnitId)
    pathxhr.onload = function () {
        if (pathxhr.status == 200) {
            var info = JSON.parse(pathxhr.response);
            getcourseInfoCallback(null, info);
        } else {
            getcourseInfoCallback(makeRequestErrorObj(pathxhr), null)
        }

    }
    pathxhr.send();
}


/*********************************************
 * 3 Takes a module from a D2L TOC and flattens it to an array of topics with absolute urls
 **********************************************/
function TOCModule2TopicsList(moduleIn, courseInfo) {
    var topicsOut;

    function getURLFromTopic(topic, courseInfo) {
        //some are set to null and I want to pass that info on to user
        if (topic.Url === null) {
            return null;
        }

        //make the url absolute
        var path,
            origin = new URI(window.location.href).origin(),
            url;

        //the URI lib throws errors if the url is not a url.
        //example href="width:100%", 'width:100%' is not a url but is in a place that should be a url
        //so catch the error and don't do anything to it but print it for fun. it will get filtered out later
        try {
            url = new URI(topic.Url);

            //if the url is relative make it absolute
            if (url.is('relative')) {
                /* We have html files with '#' in their name, # is normally reserved for hashes in urls
                 * thus in the content area there are '#' in the middle of urls that need to be encoded
                 * but libraries don't encode # by default, so we do it before we stick it in
                 */

                //fix file names with `#` in them
                //the # sign does not get encoded even though its in the middle of the file
                if (topic.Title.match(/#/g) !== null) {
                    path = topic.Url.replace(/#/g, '%23');
                }

                //fix scorm paths - scorm paths don't have the course path on it
                if (topic.TypeIdentifier.match(/scorm/i) !== null) {
                    if (typeof path !== 'undefined') {
                        path = courseInfo.Path + path;
                    } else {
                        path = courseInfo.Path + topic.Url;
                    }
                }

                //if we did either of the things above then make it a URI obj;
                if (typeof path !== 'undefined') {
                    url = new URI(path);
                }

                //the url is relative make it absolute now
                url = url.absoluteTo(origin);
            }

            //we need a string to send on
            url = url.normalize().toString();
        } catch (error) {
            //if the url is not realy a url catch the error and send on the url
            console.warn("Problem with url in toc:", url);
            console.warn("Course Name:", courseInfo.Name)
            console.error(error);
            return topic.Url;
        }



        var testing = false
        //for testing
        if (testing && topic.Url.match('#') !== null) {
            console.dir(url);
        }

        if (testing && topic.TypeIdentifier.match(/scorm/i) !== null) {
            console.dir(topic.Url);
            console.dir(path);
        }

        return url;
    }


    function proccssTopics(topics, courseInfo) {
        return topics
            //make sure the topic has a url
            // .filter(function (topic) {
            //     return typeof topic.Url !== 'undefined';
            // })
            //get the props we want
            .map(function (topic) {
                return {
                    title: topic.Title,
                    url: getURLFromTopic(topic, courseInfo),
                    topicId: topic.TopicId,
                    type: topic.TypeIdentifier
                }
            });
    }

    /********************** TOC2Topics START *****************************/
    if (module.Modules.length > 0) {

        topicsOut = moduleIn.Modules.reduce(function (topics, module) {
            //dig deeper
            if (module.Modules.length > 0) {
                //get the next level and add it to the urls
                topics = topics.concat(TOCModule2TopicsList(module, courseInfo));
            }

            //get the ones here using the supplied function
            if (module.Topics.length > 0) {
                topics = topics.concat(proccssTopics(module.Topics, courseInfo));
            }

            //send them on
            return topics;
        }, []);
    } else {
        topicsOut = proccssTopics(module.Topics, courseInfo);
    }


    return topicsOut;
}
