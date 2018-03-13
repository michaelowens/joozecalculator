import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Recipes } from '../api/recipes.js';

import './body.html';

let formErrors = new ReactiveVar([]);
let flavors = new ReactiveVar([
  {
    name: '',
    percentage: 0
  },
]);

function calculateOutcome() {
  let instance = Template.instance();
}

Template.registerHelper('instance', function () {
  return Template.instance();
});

Template.registerHelper('equals', function (a, b) {
  return a === b;
});

Template.registerHelper('indexToHumanNumber', function(i) {
  return i + 1;
});

Template.registerHelper('mlFromBatch', function(p) {
  let batch = this.state.get('batch')
  return (batch / 100 * p).toFixed(2);
});

Template.registerHelper('mgFromBatch', function(p) {
  let batch = this.state.get('batch')
  let ml = (batch / 100 * p).toFixed(2);
  return (ml * 1.06).toFixed(2);
});

Template.registerHelper('mlFromBatchWithoutFlavors', function(p) {
  let batch = this.state.get('batch')
  const reducer = (accumulator, flavor) => {
    let ml = (batch / 100 * flavor.percentage);
    return accumulator + ml;
  }
  let flavorsMl = flavors.get().reduce(reducer, 0);

  return ((batch - flavorsMl) / 100 * p).toFixed(2);
});

Template.registerHelper('pgDensity', function(p){
  let batch = this.state.get('batch')
  let pg = this.state.get('pg')
  let mg = (batch / 100 * pg)
  return density = (mg * 1.0373).toFixed(2);
});

Template.registerHelper('vgDensity', function(p){
  let batch = this.state.get('batch')
  let vg = this.state.get('vg')
  let mg = (batch / 100 * vg)
  return density = (mg * 1.2613).toFixed(2);
});

Template.registerHelper('nicotineMl', function(p) {
  let batch = this.state.get('batch')
  let nicBase = this.state.get('basenicotinestr')
  let nicTarget = this.state.get('aimnicotinestr')
  return ml = (nicTarget / (nicBase / batch)).toFixed(2);
});

Template.registerHelper('nicotineDensity', function(p) {
  let batch = this.state.get('batch')
  let nicBase = this.state.get('basenicotinestr')
  let nicTarget = this.state.get('aimnicotinestr')
  let ml = (nicTarget / (nicBase / batch)).toFixed(2);
  return density = (ml * 1.00925).toFixed(2);
});

Template.body.onCreated(function () {
  this.state = new ReactiveDict()
  stateDefaults(this.state)

  // let nomVgPercent = 0;
  // let nomPgPercent = 100;
  // let nonNicPercent = 100 - 1.8;
  // let realPgPercent = nomPgPercent * (nonNicPercent/100)
  // let targetNicVol = (this.state.get('batch') * 0.6 / 100)

  // let nicBaseTotalVolume = this.state.get('aimnicotinestr') / (this.state.get('basenicotinestr') / this.state.get('batch'))
  // let nicBaseNicVol = (0.6/100) * this.state.get('batch')
  // let nicBasePgVol = nicBaseTotalVolume * (realPgPercent/100)
  // let targetPgVol = (nomPgPercent/100) * (this.state.get('batch') - nicBaseNicVol)
  // let addPgVol = (targetPgVol - nicBasePgVol)
  // console.log(addPgVol)

});

// Set default states
function stateDefaults(state) {
  state.setDefault('batch', 10)
  state.setDefault('basenicotinestr', 18)
  state.setDefault('aimnicotinestr', 6)
  state.setDefault('nicotinemv', 1); // Default mg/ml
  state.setDefault('name', '');
  state.setDefault('withNicotine', false);
  state.setDefault('pg', 30);
  state.setDefault('vg', 70);
}

// Density values
// u.pg=1.0373;
// u.vg=1.2613;
// u.nic=1.00925;
// u.water=0.9982;
// u.flavor=1.06;

// Calculate nicotine ml by volume and weight = targetnic / (basenic / batch)
// Default example =  0.6% / (1.8% / 10ml) = 3.33ml nicotine
// Default example =  6mg / (18mg / 10ml) = 3.33ml nicotine

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
  },

  getFlavors() {
    return flavors.get();
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
    event.preventDefault();
    Recipes.remove(this.item._id);
  },

  'click .loadrecipe'(event, instance) {
    event.preventDefault();
    this.state.clear();
    stateDefaults(this.state)
    flavors.set([]);

    // TODO: first check if form is dirty, and then ask if they are sure to load so people won't lose data
    const keys = Object.keys(this.item)
    keys.forEach(k => {
      if(k === 'flavors') {
        flavors.set(this.item[k])
      } else {
        this.state.set(k, this.item[k])
      }
    });

    if(!flavors.get().length) {
      flavors.set([{name: '', percentage: 0}]);
    }
  },
});

Template.recipeform.events({
  'submit .new-recipe'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;

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
    tempData.flavors = flavors.get();

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
    event.preventDefault();
    let newFlavors = flavors.get();

    newFlavors.push({
      name: '',
      percentage: 0
    });

    flavors.set(newFlavors);
  },

  'click .removeFlavor'(event) {
    event.preventDefault();

    let newFlavors = flavors.get();
    let start = parseInt(event.target.getAttribute('data-index'));

    newFlavors.splice(start, 1);
    flavors.set(newFlavors);
  },

  'click .setDefault'(event) {
    event.preventDefault();
  },

  'click .clearRecipe'(event) {
    this.state.clear();
    stateDefaults(this.state)
    flavors.set([{name: '', percentage: 0}]);
  },

  'input .aimPg'(event) {
    this.state.set('pg', event.target.value);
    this.state.set('vg', 100 - event.target.value);
  },

  'input .aimVg'(event) {
    this.state.set('vg', event.target.value);
    this.state.set('pg', 100 - event.target.value);
  }
});

Template.flavorRow.events({
  'input .flavorName'(event) {
    let newFlavors = flavors.get();
    let index = parseInt(event.target.getAttribute('data-index'));

    newFlavors[index].name = event.target.value;
    flavors.set(newFlavors);
  },

  'input .flavorPercentage'(event) {
    let newFlavors = flavors.get();
    let index = parseInt(event.target.getAttribute('data-index'));

    newFlavors[index].percentage = parseFloat(event.target.value);
    flavors.set(newFlavors);
  }
});
