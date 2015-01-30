/**
 * @jsx React.DOM
 */

var React = window.React || require('react/addons');
var TypeaheadSelector = require('./selector');
var KeyEvent = require('../keyevent');

/**
 * A "typeahead", an auto-completing text input
 *
 * Renders an text input that shows options nearby that you can use the
 * keyboard or mouse to select.  Requires CSS for MASSIVE DAMAGE.
 */
var Typeahead = React.createClass({
  propTypes: {
    clearOnSelect: React.PropTypes.bool,
    customClasses: React.PropTypes.object,
    defaultValue: React.PropTypes.string,
    displayOriginal: React.PropTypes.bool,
    getFilterString: React.PropTypes.func,
    maxVisible: React.PropTypes.number,
    onKeyDown: React.PropTypes.func,
    onOptionSelected: React.PropTypes.func,
    options: React.PropTypes.array,
    placeholder: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      clearOnSelect: false,
      customClasses: {},
      defaultValue: "",
      displayOriginal: false,
      getFilterString: function(element) {
        return element.display;
      },
      options: [],
      onKeyDown: function(event) { return },
      onOptionSelected: function(option) { },
      placeholder: "",
      options: [],
      placeholder: ""
    };
  },

  getInitialState: function() {
    return {
      // The set of all options... Does this need to be state?  I guess for lazy load...
      options: this.props.options,

      // The currently visible set of options
      visible: this.getOptionsForValue(this.props.defaultValue, this.props.options),

      defaultValue: this.props.defaultValue,

      // A valid typeahead value
      selection: null
    };
  },

  componentWillReceiveProps: function(nextProps) {
    var defaultValue = nextProps.defaultValue === this.props.defaultValue ?
        this.state.defaultValue : nextProps.defaultValue;
    this.setState({
      options: nextProps.options,
      defaultValue: defaultValue,
      visible: this.getOptionsForValue(defaultValue, nextProps.options)
    });
  },

  getOptionsForValue: function(value, options) {
    var context = this;
    var cleanValue = value.toLowerCase();
    var result = options.filter(function(element, index, ar){
      return (context.props.getFilterString(element).toLowerCase().indexOf(cleanValue) > -1)
    });

    if (this.props.maxVisible) {
      result = result.slice(0, this.props.maxVisible);
    }
    return result;
  },

  setEntryText: function(value) {
    this.refs.entry.getDOMNode().value = value;
    this._onTextEntryUpdated();
  },

  _renderIncrementalSearchResults: function() {
    // Nothing has been entered into the textbox
    if (!this.state.defaultValue) {
      return "";
    }

    // Something was just selected
    if (this.state.selection) {
      return "";
    }

    // There are no typeahead / autocomplete suggestions
    if (!this.state.visible.length) {
      return "";
    }

    return (
      <TypeaheadSelector
        ref="sel" options={ this.state.visible }
        onOptionSelected={ this._onOptionSelected }
        customClasses={this.props.customClasses} />
   );
  },

  _onOptionSelected: function(option) {
    var nEntry = this.refs.entry.getDOMNode();
    nEntry.focus();
    var value = this.props.clearOnSelect ? "" : option.display;
    nEntry.value = value;

    this.setState({visible: [],
                   selection: option,
                   defaultValue: value});
    this.props.onOptionSelected(option);
  },

  _onTextEntryUpdated: function() {
    var value = this.refs.entry.getDOMNode().value;
    this.setState({visible: this.getOptionsForValue(value, this.state.options),
                   selection: null,
                   defaultValue: value});
  },

  _onEnter: function(event) {
    if (!this.refs.sel.state.selection) {
      return this.props.onKeyDown(event);
    }
    this._onOptionSelected(this.refs.sel.state.selection);
  },

  _onEscape: function() {
    this.refs.sel.setSelectionIndex(null)
  },

  _onTab: function(event) {
    var option = this.refs.sel.state.selection ?
      this.refs.sel.state.selection : this.state.visible[0];
    this._onOptionSelected(option)
  },

  eventMap: function(event) {
    var events = {};

    events[KeyEvent.DOM_VK_UP] = this.refs.sel.navUp;
    events[KeyEvent.DOM_VK_DOWN] = this.refs.sel.navDown;
    events[KeyEvent.DOM_VK_RETURN] = events[KeyEvent.DOM_VK_ENTER] = this._onEnter;
    events[KeyEvent.DOM_VK_ESCAPE] = this._onEscape;
    events[KeyEvent.DOM_VK_TAB] = this._onTab;

    return events;
  },

  _onKeyDown: function(event) {
    // If there are no visible elements, don't perform selector navigation.
    // Just pass this up to the upstream onKeydown handler
    if (!this.refs.sel) {
      return this.props.onKeyDown(event);
    }

    var handler = this.eventMap()[event.keyCode];

    if (handler) {
      handler(event);
    } else {
      return this.props.onKeyDown(event);
    }
    // Don't propagate the keystroke back to the DOM/browser
    event.preventDefault();
  },

  render: function() {
    var inputClasses = {}
    inputClasses[this.props.customClasses.input] = !!this.props.customClasses.input;
    var inputClassList = React.addons.classSet(inputClasses)

    var classes = {
      typeahead: true
    }
    classes[this.props.className] = !!this.props.className;
    var classList = React.addons.classSet(classes);

    return (
      <div className={classList}>
        <input ref="entry" type="text"
          placeholder={this.props.placeholder}
          className={inputClassList} 
          defaultValue={this.state.defaultValue}
          onChange={this._onTextEntryUpdated} 
          onKeyDown={this._onKeyDown} />
            {this._renderIncrementalSearchResults()}
      </div>
    );
  }
});

module.exports = Typeahead;
