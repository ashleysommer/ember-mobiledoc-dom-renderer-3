import Component from '@glimmer/component';
import MarkdownIt from "markdown-it";

export default class CardMarkdownComponent extends Component {

  get identifier() {
    return this.args.identifier || "myid";
  }

  get renderedMarkdown() {
    let payload = this.args.payload;
    let md = new MarkdownIt();
    return md.render(payload);
  }

}
