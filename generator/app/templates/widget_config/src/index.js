/**
 * Widget Configurator Sample
 * The input and output of the configurator is the profile of its corressponding 
 * widget.
 * @author zyz
 * @created 03/22/2016
 */

require('./index.css');

var dependency = require('../lib/third-party-dependency');
var locale = require('./i18n');
var template = require('./index.html');

var configurator = {
    constructor: function() {
        var tplHTML = template({
            locale: locale(),
            currentTime: new Date().toISOString()
        });
        $('body').html(tplHTML);

        alert(locale('exampleGreeting'));
    },

    /**
     * @setProfile {Function} [required] Will be called when user decides to  
     * config the widget on workbench.
     * @param profile {Object} The profile of corresponding widget.
     */
    setProfile: function(profile) {
        //TODO: 
    },
    /**
     * @getProfile {Function} [required] Will be called when user click the save
     * button which is on the bottom of the configurator dialog. Note that if the
     * profile is invalid which is configurated by user, you should gave tips to
     * user and return false to prevent this save operation.
     * @return {Object} profile
     */
    getProfile: function() {
        var isProfileValid = false
        if (!isProfileValid) {
            alert('Hey, please input sth first...');
            return false;
        }
        return {/* profile needed by widget-implementor*/};
    },    
    /**
     * @getSupportedEventList {Function} [optional] This method will be called if
     * implemented when the user click the save button to gather the events which
     * will be triggered in runtime by the widget instance. Note that the supported 
     * events would be different with the different profiles configurated by user in
     * the same type widget. 
     * @param profile {Object} The profile returned by getProfile() method which will be
     *   called before this method calling.
     * @return {Array<Object>} EventList
     */
    getSupportedEventList: function(profile) {
        // TODO: Add your code here to return different event list following
        // current configurated profile.

        // Event list example
        return [{
            // Event Id [required]
            id: "exampleEvent",
            // Event Name [required] Maybe you can set it as the same as the id.
            name: "Example Event",
            // Event Description [optional]
            // Maybe a i18n is needed to describe the event in variables languages.
            des: "Example Event description" 
        }
        // , ...
        ];
    },
    /**
     * @getSupportedVariableList {Function} [optional] This method will be called if
     * implemented when the user click the save button, to gather the variables owned
     * by the widget instance. Note that the supported variables would be different with 
     * the different profiles configurated by user in the same type widget.
     * @param profile {Object} The profile returned by getProfile() method which will be
     *   called before this method calling.
     * @return VariableList {Array<Object>} 
     **/
    getSupportedVariableList: function(profile) {

        // TODO: Add your code here to return different variable list following
        // current configurated profile.
        
        // Variable list example
        return [{
            // Variable name [required]
            name: 'exampleVar',
            // Variable type [optional default string]
            type: 'string',
            // Variable description
            des: 'example Variable description.'
        }
        // , ...
        ];
    },
    /**
     * @getDependentVariableList {Function} [optional] This method is repsonsible
     * for gathering the dependent variables of the widget from context.
     * @param profile {Object} The profile returned by getProfile() method which will be
     *   called before this method calling.
     * @return {Array<String>}
     */
    getDependentVariableList: function(profile) {
        // Variable List example
        return [
            // '1-userid',
            // '12-example-dep-var-from-other-window'
        ];
    },
    /**
     * @getWidth {Function} [optional] Get the width of the widget following
     * current configurated widget so that the width of window wrapper can be
     * auto adapted. If not implemented, your widget should adapter automatically
     * the width of outer window.
     * @param profile {Object} The profile returned by getProfile() method which will be
     *   called before this method calling.
     * @return {Number}
     */
    getWidth: function(profile) {},

    /**
     * @getHeight {Function} [optional] Get the Height of the widget following
     * current configurated widget so that the Height of window wrapper can be
     * auto adapted. If not implemented, your widget should adapter automatically
     * the Height of outer window.
     * @param profile {Object} The profile returned by getProfile() method which will be
     *   called before this method calling.
     * @return {Number}
     */
    getHeight: function() {}

};

// register configurator
Enhancer.registerWidgetConfigurator(configurator);