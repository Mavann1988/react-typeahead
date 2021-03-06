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
var TypeaheadTokenizer = React.createClass({
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
          <Token key={selected.key}
              element={selected}
              className={classList}
              onRemove={this._removeTokenForValue}
          >
          {selected.display}
          </Token>
      )
    }, this);

    var tokenContainerClasses = {}
    tokenContainerClasses[this.props.customClasses.tokenContainer] = !!this.props.customClasses.tokenContainer;
    var tokenContainerClassList = classNames(tokenContainerClasses);
    return (
        <div className={tokenContainerClassList}>
        {result}
        </div>
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
      <div>
        {this._renderTokens()}
        <Typeahead ref="typeahead"
            className={classList}
            placeholder={this.props.placeholder}
            customClasses={this.props.customClasses}
            maxVisible={this.props.maxVisible}
            options={this._getOptionsForTypeahead()}
            defaultValue={this.props.defaultValue}
            onOptionSelected={this._addTokenForValue}
            onKeyDown={this._onKeyDown}
            getFilterString={this.props.getFilterString}
            clearOnSelect={this.props.clearOnSelect}
        />
      </div>
    )
  }
});

module.exports = TypeaheadTokenizer;
