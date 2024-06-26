import React from 'react';

import { ThemeProvider } from '@mui/material/styles';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { VDomRenderer } from '@jupyterlab/apputils';
import { ITranslator, TranslationBundle } from '@jupyterlab/translation';
import { LabIcon } from '@jupyterlab/ui-components';
import { Contents } from '@jupyterlab/services';
import { Theme } from '@mui/system';
import { CodeEditor } from '@jupyterlab/codeeditor';

import { workflowsIcon } from './components/icons';

import TranslatorContext from './context';
import { JobsModel, JobsView } from './model';
import { getJupyterLabTheme } from './theme-provider';
import { WorkflowsContextProvider } from './context-provider';
import { NotebookWorkflows } from './mainviews/workflows';

export class WorkflowsPanel extends VDomRenderer<JobsModel> {
  readonly _title?: string;
  readonly _description?: string;
  readonly _app: JupyterFrontEnd;
  readonly _translator: ITranslator;
  readonly _trans: TranslationBundle;
  private _theme: Theme;
  readonly _contents: Contents.IManager;
  readonly _editorFactory: CodeEditor.Factory;

  constructor(options: NotebookJobsPanel.IOptions) {
    super(
      options.model ||
        new JobsModel({
          key: options.key,
          jobsView: options.jobsView,
          onModelUpdate: () => {
            // allow us to invoke private parent method
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.renderDOM();
          }
        })
    );
    this.addClass('jp-notebook-workflows-panel');

    const trans = options.translator.load('jupyterlab');

    this._theme = getJupyterLabTheme();
    this._contents = options.contents;
    this.title.icon = options.titleIcon ?? workflowsIcon;
    this.title.caption = options.title ?? trans.__('Workflows');
    this._description = options.description ?? trans.__('Job Runs');
    this._app = options.app;
    this._editorFactory = options.editorFactory;
    this._translator = options.translator;
    this._trans = this._translator.load('jupyterlab');

    this.node.setAttribute('role', 'region');
    this.node.setAttribute('aria-label', trans.__('Workflows'));
  }

  updateTheme(): void {
    this._theme = getJupyterLabTheme();
  }

  render(): JSX.Element {
    return (
      <ThemeProvider theme={this._theme}>
        <WorkflowsContextProvider
          app={this._app}
          contents={this._contents}
          editorFactory={this._editorFactory}
        >
          <TranslatorContext.Provider value={this._translator}>
            <NotebookWorkflows
              view={this.model.jobsView}
              model={this.model.createTaskModel}
              key={this.model.key}
            />
          </TranslatorContext.Provider>
        </WorkflowsContextProvider>
      </ThemeProvider>
    );
  }
}

namespace NotebookJobsPanel {
  export interface IOptions {
    title?: string;
    titleIcon?: LabIcon;
    description?: string;
    app: JupyterFrontEnd;
    translator: ITranslator;
    model?: JobsModel;
    contents: Contents.IManager;
    jobsView: JobsView;
    key: number;
    editorFactory: CodeEditor.Factory;
  }
}
