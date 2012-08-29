// EPE Visualization Service - Tool Loader Class
//
// Ocean Observatories Initiative 
// Education & Public Engagement Implementing Organization
//
// Written by Mike Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/27/12

/**
 * ToolLoader parent object
 */
var ToolLoader = function( config, div_vis ){
  this.config = config; // Either a full URL or numeric ID
  this.div_vis = div_vis; // Target div for the visualization

  this.get_settings();
}

/**
 * Get Settings
 */
ToolLoader.prototype.get_settings = function(){
	var self = this;

	if( typeof( self.config ) !== "number" ){

        self.settings_url = self.config;

	} else {

        self.settings_url = 'http://epe.marine.rutgers.edu/visualization/visualizations/settings/' + self.config;

	}

	//CONSOLE LOG//console.log('Config URL: ' + self.settings_url);

	$.getJSON( self.settings_url, {source:'loader'}, function( json ) {

        // set the tool's configuration and metadata

        self.configuration = json.configuration;
		self.metadata = json.metadata;

		// Load the Tool's JavaScript source code
		$.getScript( self.metadata.script_url, function() {

                //CONSOLE LOG//console.log("Tool Source Loaded.");

                // Initalize a new instance of the tool with the instance configuration
                self.vistool = eval(self.metadata.name);
                self.tool_instance = new self.vistool( self.div_vis, self.configuration);
            })
            .fail(function(source_jsonxhr, settings, exception) {
                  console.log("Ajax error: " );
                  console.log(exception);
                  console.log(settings);
            });

        // Load the Tool's CSS
        $(document.createElement('link'))
            .attr({
                href: self.metadata.css_url,
                media: 'screen',
                type: 'text/css',
                rel: 'stylesheet'
            })
            .appendTo('head');

        });
}