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
  this.state.set('batch', 10)
  this.state.set('basenicotinestr', 18)
  this.state.set('aimnicotinestr', 6)
  this.state.set('nicotinemv', 1); // Default mg/ml
  this.state.set('name', '');
  // this.state.set('showNicotine', false);
})

Template.recipeform.helpers({
  checkError(field) {
    return formErrors.get().includes(field) && 'error'
  },

  nicotineUnits() {
    return this.state.get('nicotinemv') === 2 ? '%' : 'mg/ml'
  },

  showNicotine: function() {
    return this.state.get('showNicotine');
  },
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
    Recipes.remove(this.item._id);
  },

  'click .loadrecipe'(event, instance) {
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
    const public = target.public.checked;
    const nicotinemv = target.nicotinemv.value;
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
    this.state.set('showNicotine', event.target.checked)
  }
});
