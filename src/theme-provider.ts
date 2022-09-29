import { Theme, createTheme } from '@mui/material/styles';

function getCSSVariable(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

export function getJupyterLabTheme(): Theme {
  const light = document.body.getAttribute('data-jp-theme-light');
  return createTheme({
    spacing: 4,
    components: {
      MuiButton: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiFilledInput: {
        defaultProps: {
          margin: 'dense'
        }
      },
      MuiFormControl: {
        defaultProps: {
          margin: 'dense'
        }
      },
      MuiFormHelperText: {
        defaultProps: {
          margin: 'dense'
        }
      },
      MuiIconButton: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiInputBase: {
        defaultProps: {
          margin: 'dense',
          size: 'small'
        }
      },
      MuiInputLabel: {
        defaultProps: {
          margin: 'dense'
        }
      },
      MuiListItem: {
        defaultProps: {
          dense: true
        }
      },
      MuiOutlinedInput: {
        defaultProps: {
          margin: 'dense'
        }
      },
      MuiFab: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiTable: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiTextField: {
        defaultProps: {
          margin: 'dense',
          size: 'small'
        }
      },
      MuiToolbar: {
        defaultProps: {
          variant: 'dense'
        }
      }
    },
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
    shape: {
      borderRadius: 2
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
