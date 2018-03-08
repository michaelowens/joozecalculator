import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Recipes } from '../api/recipes.js';

import './body.html';

let formErrors = new ReactiveVar([]);
function calculateOutcome() {
  let instance = Template.instance();
}

Template.registerHelper('instance', function () {
  return Template.instance();
});

Template.body.onCreated(function () {
  this.state = new ReactiveDict()
  stateDefaults(this.state)
});

// Set default states
function stateDefaults(state) {
  state.setDefault('batch', 10)
  state.setDefault('basenicotinestr', 18)
  state.setDefault('aimnicotinestr', 6)
  state.setDefault('nicotinemv', 1); // Default mg/ml
  state.setDefault('name', '');
  state.setDefault('withNicotine', false);
}

Template.recipeform.helpers({
  checkError(field) {
    return formErrors.get().includes(field) && 'error'
  },

  nicotineUnits() {
    return this.state.get('nicotinemv') === 2 ? '%' : 'mg/ml'
  },

  showNicotine: function() {
    return this.state.get('withNicotine');
  },

  saveText() {
    return this.state.get('_id') ? 'Update recipe' : 'Save recipe'
  },

  isRecipeUpdate() {
    return this.state.get('_id') != undefined
  }
});

Template.recipebook.helpers({
  recipes() {
    return Recipes.find({
      owner: Meteor.userId(),
    });
  }
});

Template.recipebook.events({
  'click .delete'(event) {
    event.preventDefault();
    Recipes.remove(this.item._id);
  },

  'click .loadrecipe'(event, instance) {
    event.preventDefault();
    // TODO: first check if form is dirty, and then ask if they are sure to load so people won't lose data
    const keys = Object.keys(this.item)
    keys.forEach(k => {
      this.state.set(k, this.item[k])
    })
  }
});

Template.recipeform.events({
  'submit .new-recipe'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    // const name = target.name.value;
    // const public = target.public.checked;
    // const nicotinemv = target.nicotinemv.value;
    // const instance = Template.instance();

    // console.log('i', instance)

    let errors = []
    if (!this.state.get('name')){
      errors.push('name')
    }

    formErrors.set(errors)
    if (errors.length) {
      return
    }

    let tempData = this.state.all();
    tempData.createdAt = new Date();
    tempData.owner = Meteor.userId();
    tempData.username = Meteor.user().username;

    // Insert a recipe into the collection
    if ('_id' in tempData) {
      Recipes.update({_id: tempData._id}, {$set: tempData})
    } else {
      Recipes.insert(tempData);
    }

    // Clear form
    target.name.value = '';
  },

  'input .basenicotinestr'(event) {
    let value = event.target.value.replace(',', '.')
    value = parseFloat(event.target.value)
    if (isNaN(value)) {
      return
    }
    this.state.set('basenicotinestr', value);
  },

  'input .aimnicotinestr'(event) {
    let value = event.target.value.replace(',', '.')
    value = parseFloat(event.target.value)
    if (isNaN(value)) {
      return
    }
    this.state.set('aimnicotinestr', value);
  },

  'change .nicotinemv'(event) {
    let val = parseFloat(event.target.value);
    this.state.set('nicotinemv', val);

    // values go either * 10 or / 10
    let currentStr = this.state.get('basenicotinestr');
    let aimcurrentStr = this.state.get('aimnicotinestr');

    if (val === 2) {
      this.state.set('basenicotinestr', (currentStr / 10).toFixed(2));
      this.state.set('aimnicotinestr', (aimcurrentStr / 10).toFixed(2));
    } else {
      this.state.set('basenicotinestr', (currentStr * 10).toFixed(2));
      this.state.set('aimnicotinestr', (aimcurrentStr * 10).toFixed(2));
    }
  },

  'input .batch'(event) {
    let val = parseFloat(event.target.value);
    this.state.set('batch', val);
    calculateOutcome();
  },

  'input .recipename'(event) {
    this.state.set('name', event.target.value);
  },

  'change .withNicotine'(event) {
    this.state.set('withNicotine', event.target.checked)
  },

  'click .addFlavor'(event) {
    // Add new row flavor
    console.log('add flavor')
  },

  'click .removeFlavor'(event) {
    // Remove clicked flavor
    console.log('remove flavor')
  },

  'click .setDefault'(event) {
    event.preventDefault();
  },

  'click .clearRecipe'(event) {
    console.log(this.state)
    this.state.clear();
    stateDefaults(this.state)
  }
});
