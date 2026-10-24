import { BookmarkPlus, Boxes, ChevronRight, PackageOpen, X, Zap } from "lucide-react";
import { Editor, NodeProject, TExportPurpose, TNodeProjectProps, blurMap, focusMap } from "$components/node-editor";
import { IBlock, TSlot, openBlocks, slotId } from "./state";
import { Row, TextInput } from "../lib/Row";
import { TProgram, buildProgram } from "./program";
import { checkPorts, programSignals } from "./ports";
import { compileBlock, paramDefaults, templates } from "$library/blockCompiler";
import { computed, effect, untracked } from "@preact/signals-react";
import { Routing, bridgePairs } from "./routing";
import { connect } from "@vicimpa/react-decorators";
import { group, icon } from "../_groups";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import { TProjectData } from "$components/node-editor/node-project/utils/projectCodec";
import { saveBlock } from "./library";
import { createPortal } from "react-dom";
import { ctx } from "../ctx";
import { delay } from "$library/function";
import { dispose } from "$library/dispose";
import { dom } from "$library/dom";
import { name } from "$library/function";
import rsp from "@vicimpa/rsp";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";
import { windowEvents } from "@vicimpa/events";

type TGroupProjectProps = TNodeProjectProps & { group: Group; };

// Проект внутри блока: типы нод, медиа и чтение старого формата — как у родителя
@connect(ctx => {
  ctx.legacyNodes = ctx.props.group.project.legacyNodes;
  return ctx.props.group.attach(ctx);
})
class GroupProject extends NodeProject {
  declare props: TGroupProjectProps;

  exportData(data: TProjectData, purpose: TExportPurpose) {
    return this.props.group.project.exportData(data, purpose);
  }

  importData(data: TProjectData) {
    return this.props.group.project.importData(data);
  }
}

const emptyGraph = (): TProjectData => ({ nodes: [], connect: [], configs: [], media: [] });

const Breadcrumbs = ({ block }: { block: Group; }) => (
  <div className={s.blockBar}>
    {computed(() => {
      const stack = openBlocks.value;

      return (
        <>
          <button onClick={() => stack[0]?.close()}>Project</button>
          {stack.map((item, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <ChevronRight size={14} />
              {item === block ? <b>{item.label}</b> : (
                <button onClick={() => stack[i + 1]?.close()}>{item.label}</button>
              )}
            </span>
          ))}
          <button title="Close (Esc)" onClick={() => block.close()} style={{ marginLeft: 8 }}>
            <X size={15} />
          </button>
        </>
      );
    })}
  </div>
);

@name('Group')
@group('block')
@icon(Boxes)
@reactive()
export default class Group extends BaseNode implements IBlock {
  @prop @store label = 'Block';
  @prop @store slots: TSlot[] = [];
  @prop @store compiled = false;

  @prop inner: NodeProject | null = null;
  @prop opened = false;

  // Скомпилированная программа, которая сейчас звучит; null — блок звучит своими нодами
  @prop program: TProgram | null = null;
  @prop compileError = '';

  labelText = computed(() => this.label);
  title = this.labelText as unknown as string;

  // Граф, ещё не загруженный во внутренний проект
  pending: TProjectData | null = emptyGraph();
  // Граф, который не удалось загрузить: сохраняем его как был, а не обломки
  broken: TProjectData | null = null;
  // Какая нода Group Input/Output владеет слотом
  owners = new Map<string, object>();
  loading = false;
  mounted = false;

  // У слота два GainNode: внешний — порт Group, внутренний — порт Group Input/Output.
  // Без компиляции их соединяет мост, с компиляцией между ними встаёт процессор.
  outers = new Map<string, GainNode>();
  inners = new Map<string, GainNode>();
  routing = new Routing<AudioNode>({
    connect: (from, to) => from.connect(to),
    disconnect: (from, to) => {
      try {
        from.disconnect(to);
      } catch { }
    },
  });
  container = dom('div', { className: s.blockEditor });

  #compileTimer: ReturnType<typeof setTimeout> | undefined;
  #compileVersion = 0;
  #portRetries = 0;

  #gain(map: Map<string, GainNode>, id: string) {
    var gain = map.get(id);

    if (!gain)
      map.set(id, gain = new GainNode(ctx));

    return gain;
  }

  outerGain(id: string) {
    return this.#gain(this.outers, id);
  }

  innerGain(id: string) {
    return this.#gain(this.inners, id);
  }

  @store
  get graph(): TProjectData {
    if (this.broken)
      return this.broken;

    if (!this.inner || this.pending)
      return this.pending ?? emptyGraph();

    const nodes = this.inner.store.flatMap(item => item.ref.current ?? []);
    return this.inner.serialize(nodes).data;
  }

  set graph(value) {
    this.broken = null;
    this.pending = value && typeof value === 'object' && Array.isArray(value.nodes) ? value : emptyGraph();
    this.reload();
  }

  attach(inner: NodeProject) {
    this.inner = inner;
    this.reload();

    return () => {
      if (this.inner === inner)
        this.inner = null;
    };
  }

  async reload() {
    const { inner, pending } = this;

    if (!inner || !pending || this.loading)
      return;

    this.loading = true;

    try {
      inner.clean();
      await delay();

      if (pending.nodes?.length)
        await inner.load(pending);

      inner.selection.select = [];
    } catch (e) {
      console.error('Cannot load block', e);
      this.broken = pending;
    } finally {
      this.loading = false;

      if (this.pending === pending)
        this.pending = null;
      else
        this.reload();

      if (this.compiled)
        this.scheduleCompile();
    }
  }

  hasSlot(id: string) {
    return this.slots.some(slot => slot.id === id);
  }

  // Нода берёт слот себе; если он уже чей-то (копия той же ноды), заводит новый
  claimSlot(owner: object, id: string, kind: TSlot['kind'], label: string) {
    const current = this.owners.get(id);

    if (!this.hasSlot(id) || (current && current !== owner))
      id = this.addSlot(kind, label);

    this.owners.set(id, owner);
    return id;
  }

  releaseSlot(owner: object, id: string) {
    if (this.owners.get(id) !== owner)
      return;

    this.owners.delete(id);
    this.removeSlot(id);
  }

  addSlot(kind: TSlot['kind'], label: string) {
    const slot = { id: slotId(), kind, label };
    this.slots = [...this.slots, slot];
    return slot.id;
  }

  renameSlot(id: string, label: string) {
    if (this.slots.some(slot => slot.id === id && slot.label !== label))
      this.slots = this.slots.map(slot => slot.id === id ? { ...slot, label } : slot);
  }

  removeSlot(id: string) {
    // Пока граф перезагружается или блок удаляют, порты не трогаем
    if (this.loading || !this.mounted)
      return;

    this.slots = this.slots.filter(slot => slot.id !== id);
  }

  portFor(id: string) {
    const gain = this.outers.get(id);
    return [...this.ports].find(port => port.props.value === gain);
  }

  scheduleCompile(delay = 250) {
    clearTimeout(this.#compileTimer);
    this.#compileTimer = setTimeout(() => this.recompile(), delay);
  }

  // Собирает граф блока в один процессор. Пока сборка не готова или не удалась, блок звучит как обычно.
  async recompile() {
    const version = ++this.#compileVersion;
    const { inner } = this;

    if (!this.compiled || !this.mounted)
      return this.setProgram(null);

    if (this.broken)
      return this.failCompile('Block graph failed to load');

    // Граф ещё грузится: попробуем позже
    if (!inner || this.pending || this.loading || inner.store.some(item => !item.ref.current))
      return this.scheduleCompile();

    const nodes = inner.store.map(item => item.ref.current!);
    const { data } = inner.serialize(nodes);
    const result = compileBlock(data);

    if (!result.ok)
      return this.failCompile(result.reason);

    const mismatch = checkPorts(nodes, data);

    // Порты могли ещё не перемонтироваться (например, после смены операции Math): ждём немного
    if (mismatch && this.#portRetries++ < 3)
      return this.scheduleCompile(500);

    if (mismatch)
      return this.failCompile(mismatch);

    this.#portRetries = 0;

    const key = JSON.stringify([result.source, result.inputs, result.outputs, result.passthrough]);
    const signals = programSignals(nodes, result);
    const current = this.program;

    // Поменялись только значения или позиции — программа та же
    if (current && current.key === key && current.signals.every((signal, i) => signal === signals[i])) {
      this.compileError = '';
      return;
    }

    try {
      const program = await buildProgram({
        key,
        result,
        signals,
        defaults: paramDefaults(data, result.params),
        outer: id => this.outerGain(id),
        onError: () => {
          if (this.program === program)
            this.failCompile('Compiled block stopped with an error');
        },
      });

      if (version !== this.#compileVersion || !this.compiled || !this.mounted) {
        program.stop();
        return;
      }

      this.compileError = '';
      this.setProgram(program);
    } catch (error) {
      console.error(error);

      if (version === this.#compileVersion)
        this.failCompile('Cannot load the compiled block');
    }
  }

  failCompile(reason: string) {
    this.compileError = reason;
    this.setProgram(null);
  }

  // Новая программа уже подключена: переключаем мосты, потом снимаем старую
  setProgram(program: TProgram | null) {
    const old = this.program;

    if (old === program)
      return;

    this.program = program;
    old?.stop();
  }

  stopCompiled() {
    this.#compileVersion++;
    clearTimeout(this.#compileTimer);
    this.compileError = '';
    this.setProgram(null);
  }

  // Читает всё, от чего зависит сгенерированный код: ноды, провода, слоты и структурные поля
  #trackStructure() {
    const { inner } = this;

    this.slots;

    if (!inner)
      return;

    inner.lines?.connects;

    for (const item of inner.store) {
      const node = item.ref.current;
      const type = node && inner.find(node)?.name;

      if (!node || !type || !Object.hasOwn(templates, type))
        continue;

      for (const key of templates[type].structural) {
        const value: unknown = (node as unknown as Record<string, unknown>)[key];

        if (value && typeof value === 'object' && 'value' in value)
          value.value;
      }
    }
  }

  open() {
    if (this.opened || !this.inner)
      return;

    this.opened = true;
    openBlocks.value = [...openBlocks.peek(), this];
    focusMap(this.inner.map);
  }

  // Закрывает блок и всё, что открыто внутри него
  close() {
    const stack = openBlocks.peek();
    const index = stack.indexOf(this);

    if (index === -1)
      return;

    for (const block of stack.slice(index).reverse() as Group[]) {
      block.opened = false;

      if (block.inner)
        blurMap(block.inner.map);
    }

    openBlocks.value = stack.slice(0, index);
  }

  _connect = () => {
    this.mounted = true;
    document.body.appendChild(this.container);

    return dispose(
      effect(() => {
        this.container.toggleAttribute('data-open', this.opened);
      }),
      windowEvents('keydown', e => {
        if (e.key === 'Escape' && openBlocks.peek().at(-1) === this)
          this.close();
      }),
      // Мосты слотов, а при скомпилированном блоке — только прямые «вход → выход»
      effect(() => {
        const { program } = this;

        this.routing.set(program ? program.passthrough : bridgePairs(
          this.slots,
          id => this.outerGain(id),
          id => this.innerGain(id)
        ));
      }),
      effect(() => {
        if (!this.compiled) {
          untracked(() => this.stopCompiled());
          return;
        }

        this.#trackStructure();
        this.#portRetries = 0;
        untracked(() => this.scheduleCompile());
      }),
      () => {
        this.mounted = false;
        this.stopCompiled();
        this.routing.clear();
        this.close();
        this.container.remove();
        this.outers.forEach(gain => gain.disconnect());
        this.inners.forEach(gain => gain.disconnect());
      }
    );
  };

  input = computed(() => (
    this.slots
      .filter(slot => slot.kind === 'in')
      .map(slot => <AudioPort key={slot.id} value={this.outerGain(slot.id)} title={slot.label} />)
  ));

  output = computed(() => (
    this.slots
      .filter(slot => slot.kind === 'out')
      .map(slot => <AudioPort key={slot.id} value={this.outerGain(slot.id)} title={slot.label} output />)
  ));

  compiledOn = computed(() => this.compiled || undefined);
  compiledText = computed(() => this.compiled ? 'ON' : 'OFF');

  // Состояние компиляции на лице блока: причина, если не вышло
  compileStatus = computed(() => {
    if (!this.compiled)
      return null;

    if (this.compileError)
      return (
        <div className={s.message} data-error title={this.compileError}>
          {this.compileError}. Playing uncompiled.
        </div>
      );

    return (
      <div className={s.message}>
        {this.program ? 'Running as one worklet' : 'Compiling…'}
      </div>
    );
  });

  _view = () => (
    <>
      <Row label="Name">
        <div className={s.field}>
          <TextInput text={this.labelText} onCommit={v => this.label = v} />
        </div>
      </Row>
      <Row label={<><Zap size={12} /> Compiled</>}>
        <rsp.button
          className={s.toggle}
          data-on={this.compiledOn}
          title="Run the whole block as one generated worklet (pure nodes only)"
          onClick={e => {
            e.currentTarget.blur();
            this.compiled = !this.compiled;
          }}
        >
          {this.compiledText}
        </rsp.button>
      </Row>
      {this.compileStatus}
      <div style={{ display: 'flex', gap: 3 }}>
        <button className={s.blockOpen} style={{ flexGrow: 1 }} onClick={e => { e.currentTarget.blur(); this.open(); }}>
          <PackageOpen size={13} /> Open block
        </button>
        <button
          className={s.blockOpen}
          title="Save to My blocks"
          onClick={e => {
            e.currentTarget.blur();
            saveBlock(this);
          }}
        >
          <BookmarkPlus size={13} />
        </button>
      </div>
      {createPortal(
        <>
          <Editor nested>
            <GroupProject nodes={this.project.nodes} ports={this.project.ports} group={this} />
          </Editor>
          <Breadcrumbs block={this} />
        </>,
        this.container
      )}
    </>
  );
}
