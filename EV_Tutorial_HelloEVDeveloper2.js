// EV_Tutorial_HelloEVDevloper
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills
// Last Update: 02/05/2013

var EV_Tutorial_HelloEVDeveloper2 = function ( domID, customToolConfiguration ) {

	// get local reference as self
	var self = this;

	// initiate the EV Tool library.. see ev_tools.js
	self.evtool = new EVTool();

    // define the default tool configuration
    self.configuration = {
        "userMessage" : "This is the default user message from the tool configuration.",
        "background-color":"#6699CC"
    }

    // set the tools "tool" object
    self.tool = {
        
        // set the dom ID of the tool object
        "domID":self.evtool.domToolID( domID ),
        
        // parse the configuration object. set the "custom" and "default" configurations
        "configuration":{
            "custom":self.configuration,
            "defaultConfiguration":self.configuration
        },
    };

     // parse the tool configuration
    self.evtool.configurationParse( self.tool.configuration.custom, customToolConfiguration );

    // any remaining javascript can be placed here. in this case we call another function
	self.subFunction();

};

EV_Tutorial_HelloEVDeveloper2.prototype.subFunction = function(){
	
	var self = this, 
        config = self.tool.configuration.custom;

    // get a reference to the tool container in the document 
    var documentToolContainer = $("#"+ self.tool.domID);

    // create an h2 element (page title) and set its static inner html
    var pageTitle = $("<h2></h2>")
        .html("EV Tutorial - Hello, EV Developer")

    var settingsDiv = $("<div></div>")
        .append(
            $("<div></div>")
            .attr("id","settings")
            .addClass("well")
            .css({
                "float":"right",
                "min-height":"300px",
                "width":"300px",
                "display":"none"
            })
            .append('<h2 class="page-header"> Tool Settings</h2>')
        );

    var settingsToggle = $("<div></div>")
        .append(
            $("<a></a>")
                .addClass("btn")
                .css({
                    "float":"right",
                })
                .html('<i class="icon icon-cog"></i> Settings')
                .on("click",function(){

                    $("#" + "settings").toggle();

                })
        )

    // color picker
    var colorpicker = $("<div></div>");

    var cp_lbl = $("<label />")
        .attr({
            'for': "cp_input",
            'title': "color picker"
        })
        .html(" a simple color picker example");

    var cp_input = $("<input />")
        .attr({
            "id": "cp_input",
            "type": "text"
        })
        .addClass("readonly")
        .val(config["background-color"])

    var el_i = $("<i></i>")
        .css({
            "background-color": config["background-color"],
        });

    var el_span = $("<span></span>")
        .addClass("add-on")
        .append(el_i);

    var el_div = $("<div></div>")
        .addClass("input-append color")
        .attr({
            "id": "cp",
            "data-color": config["background-color"],
            "data-color-format": "hex"
        })
        .append(cp_lbl).append(cp_input).append(el_span);

    $(el_div).colorpicker()
        .on("changeColor", function (cp) {
            
            $("#" + "box").css({"background-color":cp.color.toHex()});

            //tool.customization_update();
        });

    
    colorpicker.append(el_div);

    // end color picker


    // user message
    var msg_update = $("<div></div>")

    var msg_label = $("<label />")
        .attr({
            'for': "msg_input",
            'title': "custom message"
        })
        .html("Adjust text below to update the page content.");

    var msg_input = $("<textarea></textarea>")
        .attr({
            'id':"msg_input",
            'type':'textarea',
            'value':config["userMessage"],
            //'title':control.tooltip,
            'rows':5
        })
        .html(config["userMessage"])
        .on("keyup",function(msg){
            $("#userMessage").html(msg.target.value)
        });

    msg_update.append(msg_label).append(msg_input);

    // end user message

    
    // page content

    // create a h3 element (user message) and set its dynamic content
    var htmlMessage = $("<h3></h3>")
        .attr("id","userMessage")
        .html( config.userMessage )

    // create a second div element (box) and set its dynamic css attributes
    var htmlColorBox = $("<div></div>")
        .attr("id","box")
        .css(
            {
                "height":"300px",
                "width":"400px",
                "background-color":config["background-color"]
            }
        )

    // add the settings toggle button
    documentToolContainer.append(settingsToggle);

    // add the settings toggle button
    documentToolContainer.append(settingsDiv);

        // add the colorpicker to the settings div
    $("#settings").append(colorpicker).append(msg_update)

    // add the page title to the DOM
    documentToolContainer.append(pageTitle);

    // add the user message to the DOM
    documentToolContainer.append(htmlMessage);

    // add the box to the DOM
    documentToolContainer.append(htmlColorBox);

};
