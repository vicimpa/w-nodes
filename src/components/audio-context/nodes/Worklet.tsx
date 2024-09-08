import { Component, ReactNode } from "react";
import { batch, computed, signal, untracked } from "@preact/signals-react";
import { prop, reactive, signalRef } from "$library/signals";

import { BaseNode } from "../lib/BaseNode";
import { HudPortal } from "$components/node-editor/node-hud/HudPortal";
import MonacoEditor from "@monaco-editor/react";
import { Select } from "../lib/Select";
import { ctx } from "../ctx";
import { editor } from "monaco-editor";
import { name } from "$library/function";
import { store } from "$library/store";

const defaultCode = `
declare var sampleRate: number

function loop(outputs: Float32Array[][], inputs: Float32Array[][]) {
  // START_PARAMS
  var outL = outputs[0][0];
  var outR = outputs[0][1];
  var numFrames = outL.length;
  // END_PARAMS

  for(var i = 0; i < numFrames; i++) {
    outL[i] = 0;
    outR[i] = 0;
  }
}
`.trim();

const variants = Array.from({ length: 5 }, (_, i) => ({ value: i, label: `${i} channels` }));
const mode = [{ value: 1, label: 'Mono' }, { value: 2, label: 'Stereo' }];

type WorkletEditorProps = {
  worklet: Worklet;
  onClose?: (e: WorkletEditor) => void;
  onSave?: (e: WorkletEditor) => void;
};


class WorkletEditor extends Component<WorkletEditorProps> {
  ctx = this.props.worklet;

  _editor = signalRef<editor.IStandaloneCodeEditor>();
  _mode = signal(this.ctx._mode);
  _input = signal(this.ctx._input);
  _output = signal(this.ctx._output);
  _code = signal(this.ctx._code);

  render(): ReactNode {
    return (
      <HudPortal>
        <div style={{
          position: 'absolute',
          flexDirection: 'column',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <div
            style={{
              pointerEvents: 'all',
              padding: '20px',
              backgroundColor: '#333'
            }}
            onKeyDown={e => {
              e.stopPropagation();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1>Editor </h1>
              <Select label="Input channels" value={this._input} variants={variants} />
              <Select label="Output channels" value={this._output} variants={variants.slice(1)} />
              <Select label="Output mode" value={this._mode} variants={mode} />
              <div style={{ flexGrow: 1 }} />
              <button onClick={() => this.props.onSave?.(this)}>Save</button>
              <button onClick={() => this.props.onClose?.(this)}>Cancel</button>
            </div>
            <MonacoEditor
              width={800}
              height={500}
              onMount={(editor) => {
                this._editor.value = editor;
              }}
              onChange={(code) => {
                this._code.value = code ?? '';
              }}
              language="typescript"
              theme="vs-dark"
              defaultValue={this._code.value} />
          </div>
        </div>
      </HudPortal>
    );
  }
}

@name('Worklet')
@reactive()
export default class Worklet extends BaseNode {
  inputs = Array.from({ length: variants.length - 1 }, () => ctx.createGain());
  outputs = Array.from({ length: variants.length - 1 }, () => ctx.createGain());

  @store @prop _mode = 2;
  @store @prop _input = 0;
  @store @prop _output = 1;
  @store @prop _code = defaultCode;
  @store @prop _edit = false;

  _processor = computed(() => {

  });

  _view = () => {
    return (
      <>
        <button onClick={() => { this._edit = true; }}>Edit node</button>

        {
          computed(() => {
            if (!this.select) {
              if (untracked(() => this._edit))
                this._edit = false;
              return;
            }

            if (!this._edit)
              return;

            return (
              <WorkletEditor
                worklet={this}
                onClose={() => {
                  this._edit = false;
                }}
                onSave={ctx => {
                  batch(() => {
                    this._mode = ctx._mode.value;
                    this._input = ctx._input.value;
                    this._output = ctx._output.value;
                    this._code = ctx._code.value;
                    this._edit = false;
                  });
                }}
              />
            );
          })
        }
      </>
    );
  };
}