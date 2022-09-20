import { Theme, createTheme } from '@mui/material/styles';

export function getJupyterLabTheme(): Theme {
  return createTheme({
    spacing: 4,
    palette: {
      primary: {
        main: getComputedStyle(document.body).getPropertyValue(
          '--jp-brand-color1'
        )
      }
    },
    typography: {
      button: {
        textTransform: 'capitalize'
      }
    }
  });
}
