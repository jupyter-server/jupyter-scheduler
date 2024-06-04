import { LabIcon } from '@jupyterlab/ui-components';
import workflowsSvgstr from '../../../style/icons/workflows.svg';
import errorIconSvg from '../../../style/icons/error-icon.svg';

export const workflowsIcon = new LabIcon({
  name: 'jupyterlab-scheduler:workflows',
  svgstr: workflowsSvgstr
});

export const errorIcon = new LabIcon({
  name: 'failed',
  svgstr: errorIconSvg
});
