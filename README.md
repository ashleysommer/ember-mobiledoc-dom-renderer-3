ember-mobiledoc-dom-renderer-3
==============================================================================

Forked from [ember-mobiledoc-dom-renderer](https://raw.githubusercontent.com/bustle/ember-mobiledoc-dom-renderer),
updated for compatibility with Ember 3.16+ and Octane.

Added some batteries-included Cards, including a Markdown renderer card.


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v3.16 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-mobiledoc-dom-renderer-3
```


Usage
------------------------------------------------------------------------------

#### Render basic mobiledoc in your template

```hbs
<RenderMobiledoc @mobiledoc={{this.myMobileDoc}} />
```

#### Render mobiledoc with cards, using ember components to render cards

```hbs
{{! myMobiledoc is the mobiledoc you want to render }}
{{! myCardNames is an array of card names, e.g. ['embed-card', 'slideshow-card'] }}
<RenderMobiledoc @mobiledoc={{this.myMobileDoc}} @cardNames={{this.myCardNames}} />
```

The ember components with names matching the mobiledoc card names will be rendered
and passed a `payload` property.
The ember components will be in a wrapper div with the class '__rendered-mobiledoc-card' and '__rendered-mobiledoc-card-${cardName}'.

#### Customizing card lookup

If your mobiledoc card names do not match component names, you can subclass
the `render-mobiledoc` component and override its `cardNameToComponentName` method.

E.g.:

```javascript
// components/my-render-mobiledoc.js
import RenderMobiledoc from 'ember-mobiledoc-dom-renderer/components/render-mobiledoc';
class MyRenderMobiledoc extends RenderMobiledoc {
  cardNameToComponentName(mobiledocCardName) {
    return 'cards/' + mobiledocCardName;
  }
}
export default MyRenderMobiledoc;
```

#### Render mobiledoc with atoms, using ember components to render atoms

This works the same way as rendering mobiledoc with ember components for cards.
To pass atom names to the renderer, use the `atomNames` property, e.g.:
```hbs
{{! myAtomNames is an array of atom names, e.g. ['mention-atom'] }}
<RenderMobiledoc @mobiledoc={{this.myMobileDoc}} @atomNames={{myAtomNames}} />
```

The component will be passed a `payload` and `value` property.

To customize atom lookup, extend the `render-mobiledoc` component and override
its `atomNameToComponentName` method.

#### Customizing markup and section rendering
The `sectionElementRenderer` and `markupElementRenderer` options can be used to
customize the elements used for sections and inline text decorations respectively.

E.g.:

```hbs
<RenderMobiledoc @mobiledoc={{this.myMobileDoc}} @sectionElementRenderer={{this.mySectionElementRenderer}} />
```

```js
mySectionElementRenderer: {
  h1: (tagName, domDocument) => {
    let element = domDocument.createElement('h1');
    element.classList.add('primary-heading');
    return element;
  }
}
```

#### Use mobiledoc-dom-renderer directly

This addon provides the mobiledoc-dom-renderer directly. Most of the time
you will want to use the `{{render-mobiledoc}}` component, but if you need
to use the renderer directly in code, it can be imported:

`import RendererFactory from 'ember-mobiledoc-dom-renderer'`;


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
