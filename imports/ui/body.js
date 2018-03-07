import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Recipes } from '../api/recipes.js';

import './body.html';

let formErrors = new ReactiveVar([]);
let localData = new ReactiveDict({
  nicotinemv: 1 // Default mg/ml
});

Template.registerHelper('instance', function () {
  return Template.instance();
});

Template.recipeform.onCreated(function () {
  this.localData = new ReactiveDict()
  this.localData.set('basenicotinestr', 18)
  this.localData.set('aimnicotinestr', 6)
  this.localData.set('nicotinemv', 1); // Default mg/ml
})

Template.recipeform.helpers({
  checkError(field) {
    return formErrors.get().includes(field) && 'error'
  },

  nicotineUnits() {
    console.log('get units', Template.instance().localData.get('nicotinemv'))
    return Template.instance().localData.get('nicotinemv') === 2 ? '%' : 'mg/ml'
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
    Recipes.remove(this._id);
  }
});

Template.recipeform.events({
  'submit .new-recipe'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const name = target.name.value;
    const public = target.public.checked;
    const nicotinemv = target.nicotinemv.value;
    const instance = Template.instance();

    let errors = []
    if (!name){
      errors.push('name')
    }

    formErrors.set(errors)
    if (errors.length) {
      return
    }

    // Insert a task into the collection
    Recipes.insert({
      name,
      private: !public,
      createdAt: new Date(), // current time
      owner: Meteor.userId(),
      username: Meteor.user().username,
    });

    // Clear form
    target.name.value = '';
  },

  'input .basenicotinestr'(event) {
    console.log(event.target.value);
    Template.instance().localData.set('basenicotinestr', parseInt(event.target.value));
  },

  'input .aimnicotinestr'(event) {
    console.log(event.target.value);
    Template.instance().localData.set('aimnicotinestr', parseInt(event.target.value));
  },

  'change .nicotinemv'(event) {
    let instance = Template.instance();
    let val = parseInt(event.target.value);
    console.log(event.target.value);
    instance.localData.set('nicotinemv', val);

    // values go either * 10 or / 10
    let currentStr = instance.localData.get('basenicotinestr');
    let aimcurrentStr = instance.localData.get('aimnicotinestr');

    if (val === 2) {
      instance.localData.set('basenicotinestr', currentStr / 10);
      instance.localData.set('aimnicotinestr', aimcurrentStr / 10);
    } else {
      instance.localData.set('basenicotinestr', currentStr * 10);
      instance.localData.set('aimnicotinestr', aimcurrentStr * 10);
    }
  },
});
