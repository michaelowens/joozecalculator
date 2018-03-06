import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Recipes } from '../api/recipes.js';
 
import './body.html';

Template.recipeform.helpers({
  recipes() {
    return Recipes.find({
      $or: [
        // { private: { $ne: true } },
        { owner: Meteor.userId() },
      ],
    });
  },
});

Template.recipeform.events({
  'submit .new-recipe'(event) {
    // Prevent default browser form submit
    event.preventDefault();
 
    // Get value from form element
    const target = event.target;
    const name = target.name.value;
    const public = target.public.checked;

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
