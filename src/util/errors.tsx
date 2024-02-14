import React from 'react';

export const SERVER_EXTENSION_404_JSX = (
  <div>
    <p>
      The Jupyter Scheduler extension is installed but it can't be activated. It
      looks like the required Jupyter Server extension (
      <code>jupyter_scheduler</code>) is not installed or not enabled in this
      environment.
    </p>
    <h3>Why am I seeing this message?</h3>
    <p>
      If you installed the Jupyter Scheduler extension from the Extension
      Manager in JupyterLab, you might have installed only the client extension
      and not the server extension. You can install the server extension by
      running <code>pip install jupyter_scheduler</code> in the same environment
      in which you run JupyterLab.
    </p>
    <h3>How do I check if the extension is installed?</h3>
    <p>
      Please ensure that <code>jupyter server extension list</code> includes
      jupyter_scheduler and that it is enabled. If it is enabled, please restart
      JupyterLab. If the server extension is installed but not enabled, run{' '}
      <code>jupyter server extension enable --user --py jupyter_scheduler</code>{' '}
      and restart JupyterLab.
    </p>
  </div>
);
