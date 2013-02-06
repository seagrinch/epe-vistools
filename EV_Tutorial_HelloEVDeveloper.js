// EV_ToolTemplate
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University

var EV_Tutorial_HelloEVDeveloper = function ( domID, customToolConfiguration ) {

	// get local reference as self
	var self = this;

	// initiate the EV Tool library.. see ev_tools.js
	self.evtool = new EVTool();

	// define the default tool configuration
    self.configuration = {
        "userMessage" : "This is the default user message.",
        "background-color":"#6699CC"
    }

    // set the tools "tool" object
    this.tool = {
        
        // set the dom ID of the tool object
        "domID":self.evtool.domToolID( domID ),
        
        // parse the configuration object. set the "custom" and "default" configurations
        "configuration":{
            "custom":self.configuration,
            "defaultConfiguration":self.configuration
        },
    };

      // Configuration Controls
    this.controls = {
        "userMessage": {
            "type": "textbox",
            "label": "Alert Message",
            "tooltip": "Enter a new Alert Message.",
            "default_value": self.tool.configuration.custom.userMessage
        },
        "background-color": {
            "type": "colorpicker",
            "label": "Background Color",
            "tooltip": "Select a color from the colorpicker control..",
            "default_value": self.tool.configuration.custom["background-color"]
        }
    };

     // parse the tool configuration
    this.evtool.configurationParse( self.tool.configuration.custom, customToolConfiguration );

    // any remaining javascript can be placed here. in this case we call another function
	self.subFunction();

};

EV_Tutorial_HelloEVDeveloper.prototype.subFunction = function(){
	
	var self = this, config = self.tool.configuration.custom;

    // get a reference to the tool container in the document 
    var documentToolContainer = $("#"+ self.tool.domID);

    // create an h2 element (page title) and set its static inner html
    var pageTitle = $("<h2></h2>")
        .html("EV Tutorial - Hello, EV Developer")

    // create a div element (user message) and set its dynamic content
    var htmlMessage = $("<div></div>")
        .html( config.userMessage )

    // create a second div element (box) and set its dynamic css attributes
    var htmlColorBox = $("<div></div>")
        .css(
            {
                "height":"200px",
                "width":"200px",
                "background-color":config["background-color"]
            }
        )

    // add the page title to the DOM
    documentToolContainer.append(pageTitle);

    // add the user message to the DOM
    documentToolContainer.append(htmlMessage);

    // add the box to the DOM
    documentToolContainer.append(htmlColorBox);


};