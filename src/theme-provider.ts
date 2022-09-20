import { Theme, createTheme } from '@mui/material/styles';

function getCSSVariable(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name);
}

export function getJupyterLabTheme(): Theme {
  const light = document.body.getAttribute('data-jp-theme-light');
  return createTheme({
    spacing: 4,
    palette: {
      mode: light === 'true' ? 'light' : 'dark',
      primary: {
        main: getCSSVariable('--jp-brand-color1')
      },
      text: {
        primary: getCSSVariable('--jp-ui-font-color1'),
        secondary: getCSSVariable('--jp-ui-font-color2'),
        disabled: getCSSVariable('--jp-ui-font-color3')
      }
    },
    typography: {
      fontFamily: getCSSVariable('--jp-ui-font-family'),
      fontSize: 12,
      htmlFontSize: 16,
      button: {
        textTransform: 'capitalize'
      }
    }
  });
}
