import { LogIn, LogOut } from "lucide-react";
import { Row, TextInput } from "../lib/Row";
import { computed, effect, untracked } from "@preact/signals-react";
import { group, icon } from "../_groups";
import { prop, reactive } from "@vicimpa/decorators";

import { AudioPort } from "../ports/AudioPort";
import { BaseNode } from "../lib/BaseNode";
import type Group from "./Group";
import { TSlot } from "./state";
import { dispose } from "$library/dispose";
import { name } from "$library/function";
import s from "../styles.module.sass";
import { store } from "$components/node-editor";

// Вход или выход блока: порт внутри связан с портом блока снаружи через общий GainNode слота
@reactive()
class GroupPort extends BaseNode {
  kind: TSlot['kind'] = 'in';

  @prop @store slot = '';
  @prop @store label = '';
  @prop block: Group | null = null;

  labelText = computed(() => this.label || this.kind);

  _connect = () => {
    const block = (this.project.props as { group?: Group; }).group ?? null;

    if (!block)
      return;

    this.block = block;

    // Новая нода без слота (из меню) заводит свой; восстановленную ведёт эффект ниже
    const timer = setTimeout(() => {
      if (!this.slot)
        this.slot = block.claimSlot(this, '', this.kind, this.labelText.value);
    });

    return dispose(
      () => clearTimeout(timer),
      effect(() => {
        const { slot } = this;

        if (!slot)
          return;

        // Слот уже занят другой нодой (копия) — берём новый, эффект перезапустится
        const id = untracked(() => block.claimSlot(this, slot, this.kind, this.labelText.value));

        if (id !== slot) {
          this.slot = id;
          return;
        }

        return () => block.releaseSlot(this, slot);
      }),
      effect(() => {
        const { slot } = this;
        const label = this.labelText.value;

        if (untracked(() => block.hasSlot(slot)))
          block.renameSlot(slot, label);
      })
    );
  };

  port = computed(() => (
    this.block && this.slot ? (
      <AudioPort
        key={this.slot}
        value={this.block.innerGain(this.slot)}
        title={this.labelText.value}
        output={this.kind === 'in'} />
    ) : null
  ));

  _view = () => (
    <>
      <Row label="Name">
        <div className={s.field}>
          <TextInput text={this.labelText} onCommit={v => this.label = v} />
        </div>
      </Row>
      {computed(() => !this.block && (
        <Row label=""><small style={{ color: 'var(--text-muted)' }}>Works inside a block</small></Row>
      ))}
    </>
  );
}

@name('GroupInput')
@group('block')
@icon(LogIn)
@reactive()
export class GroupInput extends GroupPort {
  kind = 'in' as const;
  output = this.port;
}

@name('GroupOutput')
@group('block')
@icon(LogOut)
@reactive()
export class GroupOutput extends GroupPort {
  kind = 'out' as const;
  input = this.port;
}
