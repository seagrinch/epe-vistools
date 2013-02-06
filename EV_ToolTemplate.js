// EV_ToolTemplate
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University

var EV_ToolTemplate = function ( domID, customToolConfiguration ) {

	// get local reference as self

	var self = this;

	// initiate the EV Tool library.. see ev_tools.js
	self.evtool = new EVTool();

	// define the default tool configuration
    self.configuration = {
        "Template": "Basic Template",
        "alertMessage" : "This is the default alert message."
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
        "alertMessage": {
            "type": "textbox",
            "label": "Alert Message",
            "tooltip": "Enter a new Alert Message.",
            "default_value": self.tool.configuration.custom.alertMessage
        }
    };

     // parse the tool configuration
    this.evtool.configurationParse( self.tool.configuration.custom, customToolConfiguration );

    // any remaining javascript can be placed here. in this case we call another function
	self.subFunction();

};

EV_ToolTemplate.prototype.subFunction = function(){
	
	var self = this, config = self.tool.configuration.custom;
	
	alert( config.alertMessage )

};

EV_ToolTemplate.prototype.configuration_update = function(){

	var self = this,
		config = self.tool.configuration.custom;

	// when making changes to tool settings, you can access the object with a dot notation or square bracket notation (quoted key)

	// config value via doc accessor
	config.Template = $("config-Template").val();
	
	// config value via object key 
	config["alertMessage"] = $("config-alertMessage").val();

};