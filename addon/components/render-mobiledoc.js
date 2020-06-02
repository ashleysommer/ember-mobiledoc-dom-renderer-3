import Component from '@glimmer/component';
import { action, get, set } from '@ember/object';
import { A } from '@ember/array';
import RendererFactory from 'ember-mobiledoc-dom-renderer-3';
import { RENDER_TYPE } from 'ember-mobiledoc-dom-renderer-3';
import { getDocument } from '../utils/document';
import assign from '../utils/polyfilled-assign';
const ADD_CARD_HOOK             = 'addComponentCard';
const REMOVE_CARD_HOOK          = 'removeComponentCard';
const ADD_ATOM_HOOK             = 'addComponentAtom';
const REMOVE_ATOM_HOOK          = 'removeComponentAtom';
const CARD_TAG_NAME             = 'div';
const ATOM_TAG_NAME             = 'span';
const UUID_PREFIX               = '__rendered-mobiledoc-entity-';
export const CARD_ELEMENT_CLASS = '__rendered-mobiledoc-card';
export const ATOM_ELEMENT_CLASS = '__rendered-mobiledoc-atom';


const CARD_HOOKS = {
  ADD:    ADD_CARD_HOOK,
  REMOVE: REMOVE_CARD_HOOK
};

const ATOM_HOOKS = {
  ADD:    ADD_ATOM_HOOK,
  REMOVE: REMOVE_ATOM_HOOK
};

function rendererFor(type) {
  let hookNames;

  if (type === 'card') {
    hookNames = CARD_HOOKS;
  } else if (type === 'atom') {
    hookNames = ATOM_HOOKS;
  }

  return function({env, options}) {

    let { onTeardown } = env;
    let addHook    = options[hookNames.ADD];
    let removeHook = options[hookNames.REMOVE];
    let { entity, element } = addHook(...arguments);
    onTeardown(() => removeHook(entity));

    return element;
  };
}

function createComponentCard(name) {
  return {
    name,
    type: RENDER_TYPE,
    render: rendererFor('card')
  };
}

function createComponentAtom(name) {
  return {
    name,
    type: RENDER_TYPE,
    render: rendererFor('atom')
  };
}

export default class RenderMobiledocComponent extends Component {
  @action
  attrUpdate() {
    let mobiledoc = this.args.mobiledoc;
    //console.assert(!!mobiledoc, `Must pass mobiledoc to render-mobiledoc component`);

    if (this._teardownRender) {
      this._teardownRender();
      this._teardownRender = null;
    }
    this._renderMobiledoc(mobiledoc);
  }

  get _mdcCards() {
    // pass in an array of card names that the mobiledoc may have. These
    // map to component names using `cardNameToComponentName`
    let c = this.args.cardNames || [];
    return c.map(name => createComponentCard(name));
  }

  get _mdcAtoms() {
    // pass in an array of atom names that the mobiledoc may have. These
    // map to component names using `atomNameToComponentName`
    let a = this.args.atomNames || [];
    return a.map(name => createComponentAtom(name));
  }

  _renderMobiledoc(mobiledoc) {
    let dom = getDocument(this);

    let options = {
      dom,
      cards: this._mdcCards,
      atoms: this._mdcAtoms
    };
    [
      'mobiledoc', 'sectionElementRenderer', 'markupElementRenderer',
      'unknownCardHandler', 'unknownAtomHandler'
    ].forEach(option => {
      let value = get(this, option) || get(this.args, option);
      if (value) {
        options[option] = value;
      }
    });
    let passedOptions = this.args.cardOptions;
    let cardOptions = this._cardOptions;
    options.cardOptions = passedOptions ? assign(passedOptions, cardOptions) : cardOptions;
    let renderer = new RendererFactory(options);
    let { result, teardown } = renderer.render(mobiledoc);

    // result is a document fragment, and glimmer2 errors when cleaning it up.
    // We must append the document fragment to a static wrapper.
    // Related: https://github.com/tildeio/glimmer/pull/331 and
    //          https://github.com/yapplabs/ember-wormhole/issues/66#issuecomment-246207622
    let wrapper = this._createElement(dom, 'div');
    wrapper.appendChild(result);

    set(this, 'renderedMobiledoc', wrapper);
    this._teardownRender = teardown;
  }

  get _cardOptions() {
    return {
      [ADD_CARD_HOOK]: ({env, options, payload}) => {
        let { name: cardName, dom } = env;
        let classNames = [CARD_ELEMENT_CLASS, `${CARD_ELEMENT_CLASS}-${cardName}`];
        let element = this._createElement(dom, CARD_TAG_NAME, classNames);
        let componentName = this.cardNameToComponentName(cardName);

        let card = {
          componentName,
          destinationElement: element,
          payload,
          options
        };
        this.addCard(card);
        return { entity: card, element };
      },
      [ADD_ATOM_HOOK]: ({env, options, value, payload}) => {
        let { name: atomName, dom } = env;
        let classNames = [ATOM_ELEMENT_CLASS, `${ATOM_ELEMENT_CLASS}-${atomName}`];
        let element = this._createElement(dom, ATOM_TAG_NAME, classNames);
        let componentName = this.atomNameToComponentName(atomName);

        let atom = {
          componentName,
          destinationElement: element,
          payload,
          value,
          options
        };
        this.addAtom(atom);
        return { entity: atom, element };
      },
      [REMOVE_CARD_HOOK]: (card) => this.removeCard(card),
      [REMOVE_ATOM_HOOK]: (atom) => this.removeAtom(atom)
    };
  }

  @action
  teardownRender() {
    if (this._teardownRender) {
      this._teardownRender();
    }
  }

  // override in subclass to change the mapping of card name -> component name
  cardNameToComponentName(name) {
    return name;
  }

  // override in subclass to change the mapping of atom name -> component name
  atomNameToComponentName(name) {
    return name;
  }



  // @private
  get _componentCards() {
    if (!this.__componentCards) {
      this.__componentCards = A();
    }
    return this.__componentCards;
  }

  get _componentAtoms() {
    if (!this.__componentAtoms) {
      this.__componentAtoms = A();
    }
    return this.__componentAtoms;
  }

  addCard(card) {
    this._componentCards.pushObject(card);
  }

  removeCard(card) {
    //join(() => {
      this._componentCards.removeObject(card);
    //});
  }

  addAtom(atom) {
    this._componentAtoms.pushObject(atom);
  }

  removeAtom(atom) {
    //join(() => {
      this._componentAtoms.removeObject(atom);
    //});
  }

  static _next_uuid() {
    RenderMobiledocComponent.uuidCount += 1;
    return RenderMobiledocComponent.uuidCount;
  }

  static generateUuidString() {
    return `${UUID_PREFIX}${RenderMobiledocComponent._next_uuid()}`;
  }

  _createElement(dom, tagName, classNames=[]) {
    let el = dom.createElement(tagName);
    el.setAttribute('id', RenderMobiledocComponent.generateUuidString());
    el.setAttribute('class', classNames.join(' '));
    return el;
  }
}
RenderMobiledocComponent.uuidCount = 0;
