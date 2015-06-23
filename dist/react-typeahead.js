!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.ReactTypeahead=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
  Copyright (c) 2015 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/

function classNames () {
	'use strict';

	var classes = '';

	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (!arg) continue;

		var argType = typeof arg;

		if ('string' === argType || 'number' === argType) {
			classes += ' ' + arg;

		} else if (Array.isArray(arg)) {
			classes += ' ' + classNames.apply(null, arg);

		} else if ('object' === argType) {
			for (var key in arg) {
				if (arg.hasOwnProperty(key) && arg[key]) {
					classes += ' ' + key;
				}
			}
		}
	}

	return classes.substr(1);
}

// safely export classNames for node / browserify
if (typeof module !== 'undefined' && module.exports) {
	module.exports = classNames;
}

/* global define */
// safely export classNames for RequireJS
if (typeof define !== 'undefined' && define.amd) {
	define('classnames', [], function() {
		return classNames;
	});
}

},{}],2:[function(require,module,exports){
/**
 * PolyFills make me sad
 */
var KeyEvent = KeyEvent || {};
KeyEvent.DOM_VK_UP = KeyEvent.DOM_VK_UP || 38;
KeyEvent.DOM_VK_DOWN = KeyEvent.DOM_VK_DOWN || 40;
KeyEvent.DOM_VK_BACK_SPACE = KeyEvent.DOM_VK_BACK_SPACE || 8;
KeyEvent.DOM_VK_RETURN = KeyEvent.DOM_VK_RETURN || 13;
KeyEvent.DOM_VK_ENTER = KeyEvent.DOM_VK_ENTER || 14;
KeyEvent.DOM_VK_ESCAPE = KeyEvent.DOM_VK_ESCAPE || 27;
KeyEvent.DOM_VK_TAB = KeyEvent.DOM_VK_TAB || 9;

module.exports = KeyEvent;

},{}],3:[function(require,module,exports){
var Typeahead = require('./typeahead');
var Tokenizer = require('./tokenizer');

module.exports = {
  Typeahead: Typeahead,
  Tokenizer: Tokenizer
};

},{"./tokenizer":4,"./typeahead":6}],4:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = window.React || require('react');
var classNames = require('classnames');
var Token = require('./token');
var KeyEvent = require('../keyevent');
var Typeahead = require('../typeahead');

/**
 * A typeahead that, when an option is selected, instead of simply filling
 * the text entry widget, prepends a renderable "token", that may be deleted
 * by pressing backspace on the beginning of the line with the keyboard.
 */
var TypeaheadTokenizer = React.createClass({displayName: "TypeaheadTokenizer",
  propTypes: {
    clearOnSelect: React.PropTypes.bool,
    compareOptions: React.PropTypes.func,
    customClasses: React.PropTypes.object,
    defaultSelected: React.PropTypes.array,
    defaultValue: React.PropTypes.string,
    getFilterString: React.PropTypes.func,
    maxVisible: React.PropTypes.number,
    onTokenAdd: React.PropTypes.func,
    onTokenRemove: React.PropTypes.func,
    options: React.PropTypes.array,
    placeholder: React.PropTypes.string,
    removeLastTokenOnDelete: React.PropTypes.bool
  },

  getInitialState: function() {
    this.props.options.sort(this.props.compareOptions);
    return {
      selected: this.props.defaultSelected,
      options: this.props.options
    };
  },

  getDefaultProps: function() {
    return {
      clearOnSelect: true,
      compareOptions: function(optionA, optionB) {
        if (optionA.display < optionB.display)
          return -1;
        if (optionA.display > optionB.display)
          return 1;
        return 0;
      },
      customClasses: {},
      defaultSelected: [],
      defaultValue: "",
      getFilterString: function(element) {
        return element.display;
      },
      options: [],
      onTokenAdd: function() {},
      onTokenRemove: function() {},
      options: [],
      placeholder: "",
      removeLastTokenOnDelete: false
    };
  },

  componentWillReceiveProps: function(nextProps) {
    var defaultValue = nextProps.defaultValue === this.props.defaultValue ?
        this.state.defaultValue : nextProps.defaultValue;
    this.setState({
      options: nextProps.options,
      defaultValue: defaultValue,
      defaultSelected: nextProps.defaultSelected
    });
  },

  _renderTokens: function() {
    var tokenClasses = {}
    tokenClasses[this.props.customClasses.token] = !!this.props.customClasses.token;
    var classList = classNames(tokenClasses);

    var result = this.state.selected.map(function(selected) {
      return (
          React.createElement(Token, {key: selected.key, 
              element: selected, 
              className: classList, 
              onRemove: this._removeTokenForValue
          }, 
          selected.display
          )
      )
    }, this);

    var tokenContainerClasses = {}
    tokenContainerClasses[this.props.customClasses.tokenContainer] = !!this.props.customClasses.tokenContainer;
    var tokenContainerClassList = classNames(tokenContainerClasses);
    return (
        React.createElement("div", {className: tokenContainerClassList}, 
        result
        )
    );
  },

  _getOptionsForTypeahead: function() {
    return this.state.options;
  },

  _onKeyDown: function(event) {

    //only attempt to delete the last token if the user wants to
    if(!this.props.removeLastTokenOnDelete){
      return;
    }

    // We only care about intercepting backspaces
    if (event.keyCode !== KeyEvent.DOM_VK_BACK_SPACE) {
      return;
    }

    // No tokens
    if (!this.state.selected.length) {
      return;
    }

    // Remove token ONLY when bksp pressed at beginning of line
    // without a selection
    var entry = this.refs.typeahead.refs.entry.getDOMNode();
    if (entry.selectionStart == entry.selectionEnd &&
        entry.selectionStart == 0) {
      this._removeTokenForValue(
          this.state.selected[this.state.selected.length - 1]);
      event.preventDefault();
    }
  },

  _removeTokenForValue: function(value) {
    var index = this.state.selected.indexOf(value);
    if (index == -1) {
      return;
    }

    this.state.selected.splice(index, 1);
    this.setState({selected: this.state.selected});
    this.props.onTokenRemove(this.state.selected);
    this._addValueToOption(value);
  },

  _addTokenForValue: function(value) {
    if (this.state.selected.indexOf(value) != -1) {
      return;
    }
    this.state.selected.push(value);
    this.setState({selected: this.state.selected});
    this.props.onTokenAdd(this.state.selected);
    this._removeValueFromOptions(value);
  },

  _addValueToOption: function(value) {
    var options = this.state.options;
    var index = options.indexOf(value);
    if(index == -1){
      options.push(value);
      options.sort(this.props.compareOptions);
      this.setState({options: options});
    }
  },

  _removeValueFromOptions: function(value) {
    var options = this.state.options;
    var index = options.indexOf(value);
    if(index != -1){
      options.splice(index, 1);
      this.setState({options: options});
    }
  },

  getSelectedValue: function(){
    return this.state.selected;
  },

  render: function() {
    var classes = {}
    classes[this.props.customClasses.typeahead] = !!this.props.customClasses.typeahead;
    var classList = classNames(classes);
    return (
      React.createElement("div", null, 
        this._renderTokens(), 
        React.createElement(Typeahead, {ref: "typeahead", 
            className: classList, 
            placeholder: this.props.placeholder, 
            customClasses: this.props.customClasses, 
            maxVisible: this.props.maxVisible, 
            options: this._getOptionsForTypeahead(), 
            defaultValue: this.props.defaultValue, 
            onOptionSelected: this._addTokenForValue, 
            onKeyDown: this._onKeyDown, 
            getFilterString: this.props.getFilterString, 
            clearOnSelect: this.props.clearOnSelect}
        )
      )
    )
  }
});

module.exports = TypeaheadTokenizer;

},{"../keyevent":2,"../typeahead":6,"./token":5,"classnames":1,"react":"react"}],5:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = window.React || require('react');

/**
 * Encapsulates the rendering of an option that has been "selected" in a
 * TypeaheadTokenizer
 */
var Token = React.createClass({displayName: "Token",
  propTypes: {
    children: React.PropTypes.string,
    onRemove: React.PropTypes.func
  },

  render: function() {
    return (
      React.createElement("div", React.__spread({},  this.props, {className: "typeahead-token"}), 
        this.props.children, 
        this._makeCloseButton()
      )
    );
  },

  _makeCloseButton: function() {
    if (!this.props.onRemove) {
      return "";
    }
    return (
      React.createElement("a", {className: "typeahead-token-close", href: "#", onClick: function(event) {
          this.props.onRemove(this.props.element);
          event.preventDefault();
        }.bind(this)}, "×")
    );
  }
});

module.exports = Token;

},{"react":"react"}],6:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = window.React || require('react');
var classNames = require('classnames');
var TypeaheadSelector = require('./selector');
var KeyEvent = require('../keyevent');

/**
 * A "typeahead", an auto-completing text input
 *
 * Renders an text input that shows options nearby that you can use the
 * keyboard or mouse to select.  Requires CSS for MASSIVE DAMAGE.
 */
var Typeahead = React.createClass({displayName: "Typeahead",
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
    placeholder: React.PropTypes.string,
    forceSelection: React.PropTypes.bool,
    onNoOptionSelected: React.PropTypes.func,
    onTextEntryUpdated: React.PropTypes.func
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
      placeholder: "",
      forceSelection: false,
      onNoOptionSelected: function() { }
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
        this.props.defaultValue : nextProps.defaultValue;
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
      React.createElement(TypeaheadSelector, {
        ref: "sel", options:  this.state.visible, 
        onOptionSelected:  this._onOptionSelected, 
        customClasses: this.props.customClasses})
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
    if(this.props.onTextEntryUpdated) {
      this.props.onTextEntryUpdated(value);
    } else {
      this.setState({visible: this.getOptionsForValue(value, this.state.options),
                   selection: null,
                   defaultValue: value});
    }
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
    event.preventDefault(event);
  },

  _onBlur: function(event) {
    var optionClicked = (event.relatedTarget && event.relatedTarget.className == "typeahead-option")
                          || (event.nativeEvent.explicitOriginalTarget 
                                && (event.nativeEvent.explicitOriginalTarget.className.indexOf("typeahead-option-item") > -1
                                  || event.nativeEvent.explicitOriginalTarget.className.indexOf("typeahead-option") > -1
                                  || event.nativeEvent.explicitOriginalTarget.parentNode.className.indexOf("typeahead-option") > -1
                                  || event.nativeEvent.explicitOriginalTarget.parentNode.className.indexOf("typeahead-option-item") > -1));
    var context = this;
    setTimeout(function(){
      if(!optionClicked && !context.selection){
        if(context.props.forceSelection && !context.state.selection) {
          context.refs.entry.getDOMNode().value = "";
          context.setState({visible: []});
          context.props.onNoOptionSelected();
        }
      }
    }, 100);
  },

  render: function() {
    var inputClasses = {}
    inputClasses[this.props.customClasses.input] = !!this.props.customClasses.input;
    var inputClassList = classNames(inputClasses)

    var classes = {
      typeahead: true
    }
    classes[this.props.className] = !!this.props.className;
    var classList = classNames(classes);

    return (
      React.createElement("div", {className: classList}, 
        React.createElement("input", {ref: "entry", type: "text", 
          placeholder: this.props.placeholder, 
          className: inputClassList, 
          defaultValue: this.state.defaultValue, 
          onChange: this._onTextEntryUpdated, 
          onKeyDown: this._onKeyDown, 
          onBlur: this._onBlur}), 
            this._renderIncrementalSearchResults()
      )
    );
  }
});

module.exports = Typeahead;

},{"../keyevent":2,"./selector":8,"classnames":1,"react":"react"}],7:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = window.React || require('react');
var classNames = require('classnames');

/**
 * A single option within the TypeaheadSelector
 */
var TypeaheadOption = React.createClass({displayName: "TypeaheadOption",
  propTypes: {
    customClasses: React.PropTypes.object,
    onClick: React.PropTypes.func,
    children: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      customClasses: {},
      onClick: function(event) { 
        event.preventDefault(); 
      }
    };
  },

  getInitialState: function() {
    return {
      hover: false
    };
  },

  render: function() {
    var classes = {
      hover: this.props.hover,
      "typeahead-option-item": true
    }
    classes[this.props.customClasses.listItem] = !!this.props.customClasses.listItem;
    var classList = classNames(classes);

    return (
      React.createElement("li", {className: classList, onClick: this._onClick}, 
        React.createElement("a", {href: "#", className: this._getClasses(), ref: "anchor"}, 
           this.props.children
        )
      )
    );
  },

  _getClasses: function() {
    var classes = {
      "typeahead-option": true
    };
    classes[this.props.customClasses.listAnchor] = !!this.props.customClasses.listAnchor;
    return classNames(classes);
  },

  _onClick: function(e) {
    e.preventDefault();
    return this.props.onClick();
  }
});


module.exports = TypeaheadOption;

},{"classnames":1,"react":"react"}],8:[function(require,module,exports){
/**
 * @jsx React.DOM
 */

var React = window.React || require('react');
var TypeaheadOption = require('./option');
var classNames = require('classnames');

/**
 * Container for the options rendered as part of the autocompletion process
 * of the typeahead
 */
var TypeaheadSelector = React.createClass({displayName: "TypeaheadSelector",
  propTypes: {
    options: React.PropTypes.array,
    customClasses: React.PropTypes.object,
    selectionIndex: React.PropTypes.number,
    onOptionSelected: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      selectionIndex: null,
      customClasses: {},
      onOptionSelected: function(option) { }
    };
  },

  getInitialState: function() {
    return {
      selectionIndex: this.props.selectionIndex,
      selection: this.getSelectionForIndex(this.props.selectionIndex)
    };
  },

  render: function() {
    var classes = {
      "typeahead-selector": true
    };
    classes[this.props.customClasses.results] = this.props.customClasses.results;
    var classList = classNames(classes);

    var results = this.props.options.map(function(result, i) {
      return (
        React.createElement(TypeaheadOption, {ref: result.display, key: result.display, 
          hover: this.state.selectionIndex === i, 
          customClasses: this.props.customClasses, 
          onClick: this._onClick.bind(this, result)}, 
           result.display
        )
      );
    }, this);
    return React.createElement("ul", {className: classList}, results );
  },

  setSelectionIndex: function(index) {
    this.setState({
      selectionIndex: index,
      selection: this.getSelectionForIndex(index),
    });
  },

  getSelectionForIndex: function(index) {
    if (index === null) {
      return null;
    }
    return this.props.options[index];
  },

  _onClick: function(result) {
    this.props.onOptionSelected(result);
  },

  _nav: function(delta) {
    if (!this.props.options) {
      return;
    }
    var newIndex;
    if (this.state.selectionIndex === null) {
      if (delta == 1) {
        newIndex = 0;
      } else {
        newIndex = delta;
      }
    } else {
      newIndex = this.state.selectionIndex + delta;
    }
    if (newIndex < 0) {
      newIndex += this.props.options.length;
    } else if (newIndex >= this.props.options.length) {
      newIndex -= this.props.options.length;
    }
    var newSelection = this.getSelectionForIndex(newIndex);
    this.setState({selectionIndex: newIndex,
                   selection: newSelection});
  },

  navDown: function() {
    this._nav(1);
  },

  navUp: function() {
    this._nav(-1);
  }

});

module.exports = TypeaheadSelector;

},{"./option":7,"classnames":1,"react":"react"}]},{},[3])(3)
});