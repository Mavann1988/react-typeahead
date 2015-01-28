/**
 * @jsx React.DOM
 */

var React = window.React || require('react');
var Token = require('./token');
var KeyEvent = require('../keyevent');
var Typeahead = require('../typeahead');

/**
 * A typeahead that, when an option is selected, instead of simply filling
 * the text entry widget, prepends a renderable "token", that may be deleted
 * by pressing backspace on the beginning of the line with the keyboard.
 */
var TypeaheadTokenizer = React.createClass({
  propTypes: {
    options: React.PropTypes.array,
    customClasses: React.PropTypes.object,
    maxVisible: React.PropTypes.number,
    defaultSelected: React.PropTypes.array,
    defaultValue: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    onTokenRemove: React.PropTypes.func,
    onTokenAdd: React.PropTypes.func,
    filterOptions: React.PropTypes.shape({
      // (element from options) => string
      extract: React.PropTypes.func,
      pre: React.PropTypes.string,
      post: React.PropTypes.string,
      caseSensitive: React.PropTypes.bool
    }),
    clearOnSelect: React.PropTypes.bool
  },

  getInitialState: function() {
    return {
      selected: this.props.defaultSelected
    };
  },

  getDefaultProps: function() {
    return {
      options: [],
      defaultSelected: [],
      customClasses: {},
      defaultValue: "",
      placeholder: "",
      onTokenAdd: function() {},
      onTokenRemove: function() {},
      filterOptions: {
        extract: function(element) {
          return element.toString();
        }
      },
      clearOnSelect: true
    };
  },

  // TODO: Support initialized tokens
  //
  _renderTokens: function() {
    var tokenClasses = {}
    tokenClasses[this.props.customClasses.token] = !!this.props.customClasses.token;
    var classList = React.addons.classSet(tokenClasses);
    var result = this.state.selected.map(function(selected) {
      return (
        <Token key={selected.key}
               element={selected}
               className={classList}
               onRemove={this._removeTokenForValue}
        >
          { selected.display }
        </Token>
      )
    }, this);
    return result;
  },

  _getOptionsForTypeahead: function() {
    // return this.props.options without this.selected
    return this.props.options;
  },

  _onKeyDown: function(event) {
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
    return;
  },

  _addTokenForValue: function(value) {
    if (this.state.selected.indexOf(value) != -1) {
      return;
    }
    this.state.selected.push(value);
    this.setState({selected: this.state.selected});
    this.props.onTokenAdd(this.state.selected);
  },

  getSelectedValue: function(){
    return this.state.selected;
  },

  render: function() {
    var classes = {}
    classes[this.props.customClasses.typeahead] = !!this.props.customClasses.typeahead;
    var classList = React.addons.classSet(classes);
    return (
      <div>
        { this._renderTokens() }
        <Typeahead ref="typeahead"
          className={classList}
          placeholder={this.props.placeholder}
          customClasses={this.props.customClasses}
          maxVisible={this.props.maxVisible}
          options={this._getOptionsForTypeahead()}
          defaultValue={this.props.defaultValue}
          onOptionSelected={this._addTokenForValue}
          onKeyDown={this._onKeyDown}
          filterOptions={this.props.filterOptions}
          clearOnSelect={this.props.clearOnSelect}
        />
      </div>
    )
  }
});

module.exports = TypeaheadTokenizer;
