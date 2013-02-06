// EV_ToolTutorials_1
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University

// This tool will be used to demonstrate the creation of a very basic "hello world" type tool.


var EV_ToolTutorials_1 = function ( domID, customToolConfiguration ) {

    var self = this;
    this.evtool = new EVTool();
    
       // set the tool version 
    this.version = "1.0.1";

    // Default Configuration
    //todo: standarize configuration minimum requirements
    this.configuration = {
        
        "title": "-[TITLE]-",
        "subTitle" : "-[SUBTITLE]-",
        "content" : "This is some <b>default</b> html content.",
        "height": "300",
        "width": "500",
        "background-color":"#6699CC"
    };


	// set the tool object of the primary tool.. this holds the ID of the DOM element (div placeholder)
	// todo: rename default configuration to defaultConfig since default is a reserved word
    this.tool = {
        domID:self.evtool.domToolID( domID ),
        configuration:{
            custom:self.configuration,
            default:self.configuration
        },
        settings:{
	    	chart:{
	    		layout:{
	    			height: null,
	    			width: null,
	    			margins:{
	    				top:10,
	    				right:10,
	    				bottom:10,
	    				left:10
	    			}
	    		}
	    	}
	    },    
        controls:{}
    };

    // Configuration Controls
    this.controls = {
        "title": {
            "type": "textbox",
            "label": "Title",
            "tooltip": "Enter a title for testing the tool control.",
            "default_value": this.tool.configuration.custom.title
        },
         "subTitle": {
            "type": "textbox",
            "label": "Sub Title",
            "tooltip": "Enter a subtitle for testing the tool control.",
            "default_value": this.tool.configuration.custom.subTitle
        },
        "height": {
            "type": "textbox",
            "label": "Default Height",
            "tooltip": "Default Height.",
            "default_value": this.tool.configuration.custom.height
        },
        "width": {
            "type": "textbox",
            "label": "Default Width",
            "tooltip": "Default Width.",
            "default_value": this.tool.configuration.custom.width
        },
        "background-color": {
            "type": "colorpicker",
            "label": "Default background color",
            "tooltip": "Default background color",
            "default_value": this.tool.configuration.custom["background-color"]
        }
            
    }
    
    // parse the tool configuration
    this.evtool.configurationParse( self.tool.configuration.custom, customToolConfiguration );

    // initialize the tool and follow with any necessary functions
    this.uiToolInterface();
    
};


EV_ToolTutorials_1.prototype.uiToolInterface = function ( ) {
    "use strict";

    var self = this, 
    id = self.tool.domID, 
    config = self.tool.configuration.custom,
    settings = self.tool.settings;

    // using jquery, create a docment element div, and assign the bootstrap container-fluid
    var uiContainer = $("<div></div>")
        .addClass("container-fluid");

    // append a fluid row and create the tool placeholder div
    uiContainer.append(
        $("<div></div>")
            .addClass("row-fluid")
            .append(
                $("<div></div>").addClass("span12")
                    .attr("id", id + "-tool-container")
                    .css({
                    	"height":config.height + "px",
                    	"width":config.width + "px",
                    	"border":"1px solid #CCCCCC",
                    	"padding-top": settings.chart.layout.margins.top + "px",
                    	"padding-right": settings.chart.layout.margins.right + "px",
                    	"padding-bottom": settings.chart.layout.margins.bottom + "px",
                    	"padding-left": settings.chart.layout.margins.left + "px"
                    })
                   
                    .append(
                    	$("<div></div>")
                    		.append("<h2>" + config.title + " <small> " + config.subTitle + "</small></h2>")
                    		.append("<hr>")
                    		.append($("<div></div>")                    	
                    	 		.css({'background-color': config["background-color"] })
                    			.html(config.content)
                    		)
            		)

            )
        );

    // add tool container to the placeholder div
    $("#" + id).append( uiContainer );

    // get the width of the layout container from the broswer and set it in the chart.layout.container object
    settings.chart.layout.width = $("#" + id + "-tool-container").width();

};

EV_ToolTutorials_1.prototype.customization_update = function () {

    // this function will update the config file which is used for subsequent calls and lookups
    // todo: should only update the current parameter (passed into function), not all parameters

    var self = this,
        config = self.tool.configuration.custom;

    config["title"] = $('#config-title').val();
    config["subTitle"] = $('#config-subTitle').val();
    config["content"] = $('#config-content').val();
    config["height"] = $('#config-height').val();
    config["width"] = $('#config-width').val();
    config["background-color"] = $('#config-background-color').val();

};