import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Component from '@ember/component';
import { run } from '@ember/runloop';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import RenderMobiledocComponent, {
  CARD_ELEMENT_CLASS, ATOM_ELEMENT_CLASS
} from 'ember-mobiledoc-dom-renderer-3/components/render-mobiledoc';
import {
  createSimpleMobiledoc,
  createMobiledocWithStrongMarkup,
  createMobiledocWithCard,
  createMobiledocWithAtom
} from '../../helpers/mobiledoc';
const cardName = 'sample-test-card';
const atomName = 'sample-test-atom';

module('Integration | Component | render-mobiledoc', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders mobiledoc', async function(assert) {
    this.set('mobiledoc', createSimpleMobiledoc('Hello, world!'));
    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} />`);
    let a = this.element.querySelector("p");
    assert.equal(a.textContent.trim(), "Hello, world!");
  });

  test('it renders mobiledoc with cards', async function(assert) {
    this.set('mobiledoc', createMobiledocWithCard(cardName));
    this.set('cardNames', [cardName]);
    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @cardNames={{cardNames}} />`);
    let a = this.element.querySelector('#sample-test-card')
    assert.ok(a, 'renders card template');
    assert.equal(a.textContent.trim(), 'foo: bar');
    let c = this.element.querySelectorAll('.' + CARD_ELEMENT_CLASS);
    assert.ok(c.length, `renders card with class ${CARD_ELEMENT_CLASS}`);
    let d = this.element.querySelectorAll('.' + CARD_ELEMENT_CLASS + '-' + cardName)
    assert.ok(d.length, `renders card with class ${CARD_ELEMENT_CLASS}-${cardName}`);
  });

  test('it uses `cardNameToComponentName` to allow selecting components', async function(assert) {
    this.set('mobiledoc', createMobiledocWithCard(cardName));
    this.set('cardNames', [cardName]);

    let passedCardName;
    class c extends RenderMobiledocComponent {
      cardNameToComponentName(cardName) {
        passedCardName = cardName;
        return 'sample-changed-name-test-card';
      }
    }
    this.owner.register('component:my-render-mobiledoc', c);

    await render(hbs`{{my-render-mobiledoc mobiledoc=mobiledoc cardNames=cardNames}}`);
    let a = this.element.querySelector('#sample-changed-name-test-card');
    assert.ok(a,'renders card template');
    assert.equal(a.textContent.trim(), "foo: bar", 'renders card payload');
    assert.equal(passedCardName, 'sample-test-card', 'calls `cardNameToComponentName` with correct card');
  });

  test('it renders mobiledoc with atoms', async function(assert) {
    this.set('mobiledoc', createMobiledocWithAtom(atomName));
    this.set('atomNames', [atomName]);
    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @atomNames={{atomNames}} />`);
    let a = this.element.querySelector('#sample-test-atom');
    assert.ok(a, 'renders atom template');
    assert.ok(a.textContent.includes("value: value"), 'renders atom value');
    assert.ok(a.textContent.includes("payload: bar"), 'renders atom payload');
    assert.ok(this.element.querySelectorAll('.' + ATOM_ELEMENT_CLASS).length,
      `renders atom with class ${ATOM_ELEMENT_CLASS}`);
    assert.ok(this.element.querySelectorAll('.' + ATOM_ELEMENT_CLASS + '-' + atomName).length,
      `renders atom with class ${ATOM_ELEMENT_CLASS}-${atomName}`);
  });

  test('it uses `atomNameToComponentName` to allow selecting components', async function(assert) {
    this.set('mobiledoc', createMobiledocWithAtom(atomName));
    this.set('atomNames', [atomName]);

    let passedAtomName;
    class c extends RenderMobiledocComponent {
      atomNameToComponentName(atomName) {
        passedAtomName = atomName;
        return 'sample-changed-name-test-atom';
      }
    }
    this.owner.register('component:my-render-mobiledoc', c);

    await render(hbs`{{my-render-mobiledoc mobiledoc=mobiledoc atomNames=atomNames}}`);
    let a = this.element.querySelector('#sample-changed-name-test-atom');
    assert.ok(a, 'renders atom template');
    assert.ok(a.textContent.includes("value: value"), 'renders atom value');
    assert.ok(a.textContent.includes("payload: bar"), 'renders atom payload');
    assert.equal(passedAtomName, 'sample-test-atom',
      'calls `atomNameToComponentName` with correct atom');
  });

  test('it does not rerender if a atom component changes its card\'s payload or value', async function(assert) {
    let inserted = 0;
    let atom;
    let NewComponent = Component.extend({
      didInsertElement() {
        atom = this;
        inserted++;
      }
    });
    this.owner.register('component:test-atom', NewComponent);
    this.set('mobiledoc', createMobiledocWithAtom('test-atom'));
    this.set('atomNames', ['test-atom']);
    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @atomNames={{atomNames}} />`);

    assert.equal(inserted, 1, 'inserts component once');
    run(() => atom.set('payload', {}));
    assert.equal(inserted, 1, 'after modifying payload, does not insert component atom again');
    run(() => atom.set('value', {}));
    assert.equal(inserted, 1, 'after modifying value, does not insert component atom again');
  });

  test('teardown destroys atom components', async function(assert) {
    this.set('showRendered', true);
    this.set('mobiledoc', createMobiledocWithAtom('test-atom'));
    this.set('atomNames', ['test-atom']);

    let didDestroy = [], didInsert = [];
    class c extends RenderMobiledocComponent {
      willDestroy() {
        didDestroy.push('my-render-mobiledoc');
      }
    }
    this.owner.register('component:my-render-mobiledoc', c);

    let NewComponent = Component.extend({
      didInsertElement() { didInsert.push('test-atom'); },
      willDestroy() { didDestroy.push('test-atom'); }
    });
    this.owner.register('component:test-atom', NewComponent);

    await render(
      hbs`{{#if showRendered}}
      {{my-render-mobiledoc mobiledoc=mobiledoc atomNames=atomNames}}
    {{/if}}`
    );

    assert.deepEqual(didDestroy, [], 'nothing destroyed');
    assert.deepEqual(didInsert, ['test-atom'], 'test-atom inserted');

    didInsert = [];

    this.set('mobiledoc', createSimpleMobiledoc('no cards or atoms'));

    assert.deepEqual(didDestroy, ['test-atom'], 'test-atom destroyed');
    assert.deepEqual(didInsert, [], 'nothing inserted');

    didDestroy = [];

    this.set('mobiledoc', createMobiledocWithAtom('test-atom'));

    didInsert = [];
    didDestroy = [];

    this.set('showRendered', false);

    assert.deepEqual(didDestroy, ['my-render-mobiledoc', 'test-atom'], 'destroyed all');
    assert.deepEqual(didInsert, [], 'nothing inserted');
  });

  test('changing mobiledoc calls teardown and destroys atom component', async function(assert) {
    this.set('mobiledoc', createMobiledocWithAtom('test-atom'));
    this.set('atomNames', ['test-atom', 'other-atom']);

    let didDestroy = [], didInsert = [];

    this.owner.register('component:test-atom', Component.extend({
      didInsertElement() { didInsert.push('test-atom'); },
      willDestroy() { didDestroy.push('test-atom'); }
    }));
    this.owner.register('component:other-atom', Component.extend({
      didInsertElement() { didInsert.push('other-atom'); },
      willDestroy() { didDestroy.push('other-atom'); }
    }));

    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @atomNames={{atomNames}} />`);

    assert.deepEqual(didDestroy, [], 'nothing destroyed');
    assert.deepEqual(didInsert, ['test-atom'], 'test-atom inserted');

    didInsert = [];

    this.set('mobiledoc', createMobiledocWithAtom('other-atom'));

    assert.deepEqual(didInsert, ['other-atom'], 'inserted other atom');
    assert.deepEqual(didDestroy, ['test-atom'], 'destroyed test-atom');
  });

  test('it rerenders when its mobiledoc changes', async function(assert) {
    this.set('mobiledoc', createSimpleMobiledoc('Hello, world!'));
    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} />`);
    this.set('mobiledoc', createSimpleMobiledoc('Goodbye, world!'));
    assert.equal(this.element.querySelector("div > p").textContent.trim(), 'Goodbye, world!');
  });

  test('it does not rerender if a card component changes its card\'s payload', async function(assert) {
    let inserted = 0;
    let card;
    let NewComponent = Component.extend({
      didInsertElement() {
        card = this;
        inserted++;
      }
    });
    this.owner.register('component:test-card', NewComponent);
    this.set('mobiledoc', createMobiledocWithCard('test-card'));
    this.set('cardNames', ['test-card']);
    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @cardNames={{cardNames}} />`);
    assert.equal(inserted, 1, 'inserts component once');
    run(() => card.set('payload', {}));
    assert.equal(inserted, 1, 'after modifying payload, does not insert component card again');
  });

  test('teardown destroys card components', async function(assert) {
    this.set('showRendered', true);
    this.set('mobiledoc', createMobiledocWithCard('test-card'));
    this.set('cardNames', ['test-card']);

    let didDestroy = [], didInsert = [];
    class c extends RenderMobiledocComponent {
      willDestroy() {
        didDestroy.push('my-render-mobiledoc');
      }
    }
    this.owner.register('component:my-render-mobiledoc', c);

    let NewComponent = Component.extend({
      didInsertElement() { didInsert.push('test-card'); },
      willDestroy() { didDestroy.push('test-card'); }
    });
    this.owner.register('component:test-card', NewComponent);

    await render(
      hbs`{{#if showRendered}}
      {{my-render-mobiledoc mobiledoc=mobiledoc cardNames=cardNames}}
    {{/if}}`
    );

    assert.deepEqual(didDestroy, [], 'nothing destroyed');
    assert.deepEqual(didInsert, ['test-card'], 'test-card inserted');

    didInsert = [];

    this.set('mobiledoc', createSimpleMobiledoc('no cards'));

    assert.deepEqual(didDestroy, ['test-card'], 'test-card destroyed');
    assert.deepEqual(didInsert, [], 'nothing inserted');

    // Change back to mobiledoc with card
    this.set('mobiledoc', createMobiledocWithCard('test-card'));

    didInsert = [];
    didDestroy = [];

    this.set('showRendered', false);

    assert.deepEqual(didDestroy, ['my-render-mobiledoc', 'test-card'], 'destroyed all');
    assert.deepEqual(didInsert, [], 'nothing inserted');
  });

  test('changing mobiledoc calls teardown and destroys card components', async function(assert) {
    this.set('mobiledoc', createMobiledocWithCard('test-card'));
    this.set('cardNames', ['test-card', 'other-card']);

    let didDestroy = [], didInsert = [];
    class c extends RenderMobiledocComponent {
      willDestroy() {
        didDestroy.push('my-render-mobiledoc');
      }
    }
    this.owner.register('component:my-render-mobiledoc', c);

    this.owner.register('component:test-card', Component.extend({
      didInsertElement() { didInsert.push('test-card'); },
      willDestroy() { didDestroy.push('test-card'); }
    }));
    this.owner.register('component:other-card', Component.extend({
      didInsertElement() { didInsert.push('other-card'); },
      willDestroy() { didDestroy.push('other-card'); }
    }));

    await render(hbs`{{my-render-mobiledoc mobiledoc=mobiledoc cardNames=cardNames}}`);

    assert.deepEqual(didDestroy, [], 'nothing destroyed');
    assert.deepEqual(didInsert, ['test-card'], 'test-card inserted');

    didInsert = [];

    // change mobiledoc to one with other-card
    this.set('mobiledoc', createMobiledocWithCard('other-card'));

    assert.deepEqual(didInsert, ['other-card'], 'inserted other card');
    assert.deepEqual(didDestroy, ['test-card'], 'destroyed test-card');
  });

  test('Can pass unknownCardHandler', async function(assert) {
    let called = 0;
    this.set('unknownCardHandler', () => { called++; });
    this.set('mobiledoc', createMobiledocWithCard('unknown'));

    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @unknownCardHandler={{unknownCardHandler}} />`);

    assert.equal(called, 1, 'unknownCardHandler called');
  });

  test('Can pass unknownAtomHandler', async function(assert) {
    let called = 0;
    this.set('unknownAtomHandler', () => { called++; });
    this.set('mobiledoc', createMobiledocWithAtom('unknown'));

    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @unknownAtomHandler={{unknownAtomHandler}} />`);

    assert.equal(called, 1, 'unknownAtomHandler called');
  });

  test('Can pass sectionElementRenderer', async function(assert) {
    this.set('sectionElementRenderer', {
      p(_, doc) { return doc.createElement('h1'); }
    });
    this.set('mobiledoc', createSimpleMobiledoc('Hi'));

    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @sectionElementRenderer={{sectionElementRenderer}} />`);
    let a = this.element.querySelector('h1');
    assert.ok(a, 'renders mobiledoc');
    assert.ok(a.textContent.includes("Hi"), 'renders mobiledoc content');
  });

  test('Can pass markupElementRenderer', async function(assert) {
    this.set('markupElementRenderer', {
      strong(_, doc) { return doc.createElement('span'); }
    });
    this.set('mobiledoc', createMobiledocWithStrongMarkup('Hi'));

    await render(hbs`<RenderMobiledoc @mobiledoc={{mobiledoc}} @markupElementRenderer={{markupElementRenderer}} />`);

    let a = this.element.querySelector('span');
    assert.ok(a, 'renders mobiledoc');
    assert.ok(a.textContent.includes("Hi"), 'renders mobiledoc content');
  });

  test('Can pass cardOptions and they appear for cards', async function(assert) {
    assert.expect(1);
    let passedOption = {};
    let cardName = 'my-card';
    this.set('mobiledoc', createMobiledocWithCard(cardName));
    this.set('cardNames', [cardName]);
    this.set('cardOptions', {passedOption});
    let CardComponent = Component.extend({
      init() {
        this._super(...arguments);
        assert.equal(this.options.passedOption, passedOption);
      }
    });
    this.owner.register('component:my-card', CardComponent);

    await render(hbs`{{render-mobiledoc mobiledoc=mobiledoc cardNames=cardNames cardOptions=cardOptions}}`);
  });

  test('Can pass cardOptions and they appear for atoms', async function(assert) {
    assert.expect(1);
    let passedOption = {};
    let atomName = 'my-atom';
    this.set('mobiledoc', createMobiledocWithAtom(atomName));
    this.set('atomNames', [atomName]);
    this.set('cardOptions', {passedOption});
    let AtomComponent = Component.extend({
      init() {
        this._super(...arguments);
        assert.equal(this.options.passedOption, passedOption);
      }
    });
    this.owner.register('component:my-atom', AtomComponent);

    await render(hbs`{{render-mobiledoc mobiledoc=mobiledoc atomNames=atomNames cardOptions=cardOptions}}`);
  });


});


