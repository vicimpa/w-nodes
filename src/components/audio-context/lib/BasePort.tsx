import { NodePort } from "$components/node-editor";
import s from "../styles.module.sass";

export class BasePort extends NodePort {
  title = this.props.output ? 'out' : 'in';
  color = '#555';

  render() {
    return (
      <div className={s.port} data-output={this.props.output}>
        {super.render()}
        <span>{this.title}</span>
      </div>
    );
  }
}