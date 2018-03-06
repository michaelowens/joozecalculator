import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { Recipes } from '../api/recipes.js';

import './body.html';

let formErrors = new ReactiveVar([]);

Template.recipeform.helpers({
  checkError(field) {
    return formErrors.get().includes(field) && 'error'
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
});
