var _ = require('lodash');
var assert = require('chai').assert;
var React = require('react/addons');
var Typeahead = require('../src/typeahead');
var TypeaheadOption = require('../src/typeahead/option');
var TypeaheadSelector = require('../src/typeahead/selector');
var TestUtils = React.addons.TestUtils;

function simulateTextInput(component, value) {
  var node = component.refs.entry.getDOMNode();
  node.value = value;
  TestUtils.Simulate.change(node);
  return TestUtils.scryRenderedComponentsWithType(component, TypeaheadOption);
}

var BEATLES = ['John', 'Paul', 'George', 'Ringo'];

describe('Typeahead Component', function() {

  context('invalid props', function() {
    it('throws as expected', function() {
      var propTypes = Object.keys(Typeahead.propTypes);
      var args = _.zipObject(propTypes, _.map(propTypes, function(){
        // NaN destroyer of worlds! this simulates passing in a mismatched
        // type. `undefined` gets overridden by any defaultProps, plus how
        // often do you get to use NaN?
        return NaN;
      }));
      assert.throws(function(){
        TestUtils.renderIntoDocument(Typeahead(args));
      });
    });
  });

  context('sanity', function() {
    it('should fuzzy search and render matching results', function() {
      var component = TestUtils.renderIntoDocument(Typeahead({
        options: BEATLES,
      }));

      // hash of input values to num of expected results
      var testplan = {
        'o': 3,
        'pa': 1,
        'Grg': 1,
        'Ringo': 1,
        'xxx': 0
      };

      _.each(testplan, function(expected, value) {
        var results = simulateTextInput(component, value);
        assert.equal(results.length, expected, 'Text input: ' + value);
      });
    });
  });

  context('maxVisible', function() {
    it('should limit the result set based on the maxVisible option', function() {
      var component = TestUtils.renderIntoDocument(Typeahead({
        options: BEATLES,
        maxVisible: 1
      }));
      var results = simulateTextInput(component, 'o');
      assert.equal(results.length, 1);
    });
  });

});
