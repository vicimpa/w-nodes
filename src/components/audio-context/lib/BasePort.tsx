import { NodePort } from "$components/node-editor";
import s from "../styles.module.sass";

export class BasePort extends NodePort {
  title: string = '';
  color = '#555';
  output = !!this.props.output;

  render() {
    this.title = this.props.title ?? (this.props.output ? 'out' : 'in');
    return (
      <div className={s.port} data-output={this.props.output}>
        {super.render()}
        <span>{this.title}</span>
      </div>
    );
  }
}