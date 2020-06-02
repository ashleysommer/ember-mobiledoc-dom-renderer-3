import Controller from '@ember/controller';
import { action } from '@ember/object';

let mobiledocs = {
  simple: {
    version: '0.3.1',
    markups: [],
    cards: [],
    atoms: [],
    sections: [
      [1, 'P', [
        [0, [], 0, 'Hello world!']
      ]]
    ]
  },
  card: {
    version: '0.3.1',
    markups: [],
    cards: [['sample-card', {}]],
    atoms: [],
    sections: [
      [10, 0]
    ]
  },
  atom: {
    version: '0.3.1',
    markups: [],
    cards: [],
    atoms: [['sample-test-atom', 'bob', {foo: 'bar'}]],
    sections: [
      [1, 'P', [
        [0, [], 0, 'Hello card'],
        [1, 0, [], 0],
        [0, [], 0, '!']
      ]]
    ]
  }
};

export default Controller.extend({
  cardNames: null,
  atomNames: null,
  init() {
    this._super(...arguments);
    this.set('mobiledoc', mobiledocs['simple']);
    this.set('mobiledocNames', Object.keys(mobiledocs));
    this.set('cardNames', ['sample-card']);
    this.set('atomNames', ['sample-test-atom']);
  },

  @action
  selectMobiledoc({target: {value}}) {
    this.set('mobiledoc', mobiledocs[value]);
  }

});
