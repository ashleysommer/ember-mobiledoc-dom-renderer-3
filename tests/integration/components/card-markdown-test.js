import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | card-markdown', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {

    this.set("examplePayload", "# Hello World\n\n## Hello Again!");
    this.set("exampleOptions", []);
    await render(hbs`<CardMarkdown @payload={{this.examplePayload}} @options={{this.exampleOptions}} />`);

    assert.ok(this.element.textContent.includes("<h1>Hello World</h1>"), 'Has header1')
    assert.ok(this.element.textContent.includes("<h2>Hello Again!</h2>"), 'Has header2');
  });
});
