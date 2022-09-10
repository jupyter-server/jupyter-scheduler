import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';


/**
 * Initialization data for the jupyter-scheduler extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-scheduler:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyter-scheduler is activated!');
  }
};

export default plugin;
