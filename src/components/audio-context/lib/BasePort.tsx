import { NodePort } from "$components/node-editor";
import { connect } from "@vicimpa/react-decorators";
import { groupColor } from "../_groups";
import s from "../styles.module.sass";

@connect(ctx => {
  ctx.color = groupColor(ctx.item.constructor);
  ctx.port.value?.style.setProperty('--color', ctx.color);
})
export class BasePort extends NodePort {
  title: string = '';
  output = !!this.props.output;

  render() {
    const { output, title, bare } = this.props;

    this.title = title ?? (output ? 'out' : 'in');

    return (
      <div className={s.port} data-output={output || undefined} data-bare={bare || undefined}>
        {super.render()}
        {!bare && <span>{this.title}</span>}
      </div>
    );
  }
}
