#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');

/**
Content we need:
  Welcome
  Timetable
  Locations
  Where to stay / hotels
  Transport & travel
  RSVP
  Wedding list
*/


/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */
var pages = [];
var homePage;
var bunting;

    self.loadFiles = function() {
	var PAGES_LOCATION = './pages/';
	var filenames = fs.readdirSync(PAGES_LOCATION);

	for(var i = 0; i < filenames.length; i++) {
	    var file = filenames[i];
	    pages.push({name: file, content: fs.readFileSync(PAGES_LOCATION + file)});
	}
	pages.push({name: 'rsvp', content: fs.readFileSync(PAGES_LOCATION + 'rsvp.html')});
	pages.push({name: 'photo', content: fs.readFileSync(PAGES_LOCATION + 'photos.html')});
	pages.push({name: 'photos', content: fs.readFileSync(PAGES_LOCATION + 'photos.html')});
	pages.push({name: 'photo.html', content: fs.readFileSync(PAGES_LOCATION + 'photos.html')});
	
	homePage = fs.readFileSync("./home.html")
	bunting = fs.readFileSync("./extra/bunting.svg")
    }
    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

	var header = "<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" charset=\"UTF-8\"><title>Verity and Paul's Wedding Website</title><link rel=\"stylesheet\" href=\"resources/style.css\"></head><body>";
	var footer = "</body></html>"

	var menu = "<div class=\"menu\"><p><a href='/'>Home</a> | <a href='timetable.html'>Timetable</a> | <a href='locations.html'>The venues</a> | <a href='wheretostay.html'>Staying in St Albans</a> | <a href='photos.html'>Share your photos</a> | <a href='buffet.html'>Buffet</a> | <a href='gifts.html'>Gift list</a></p></div>"

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(bunting + header + menu + "<div class=\"body\">" + homePage + "</div>" + menu + footer);
        };

	function addPage(page) {
	    return function(req, res) {
		res.setHeader('Content-Type', 'text/html');
		res.send(bunting + header + menu + "<div class=\"body\">" + page.content + "</div>" + menu + footer);
	    }
	}

	for(var i = 0; i < pages.length; i++) {
	    var page = pages[i];
//	    console.log(page.content);
	    self.routes['/' + page.name] = addPage(page); 
	}
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
	self.loadFiles();
        self.createRoutes();
        self.app = express();
	self.app.use('/resources', express.static(__dirname + '/resources'));
//	self.app.use('/', express.static(__dirname + '/pages'));

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

