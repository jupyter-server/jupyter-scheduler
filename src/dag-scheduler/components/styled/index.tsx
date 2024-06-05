import {
  Alert,
  Drawer,
  IconButton,
  Select,
  SelectProps,
  TextField,
  TextFieldProps,
  styled
} from '@mui/material';
import { Stack } from '@mui/system';

export const StyledDrawer = styled(Drawer)({
  '& .MuiDrawer-root': {
    position: 'absolute',
    width: '100%'
  },
  '& .MuiPaper-root': {
    width: '100%',
    position: 'absolute',
    marginBottom: '2px',
    boxSizing: 'border-box',
    border: '1px solid var(--jp-border-color2)',
    boxShadow: '4px 8px 12px 1px rgba(0,0,0,.12)'
  }
});

export const StyledIconButton = styled(IconButton)({
  borderRadius: 1,
  background: 'var(--node-bg-color)',
  color: 'var(--jp-text-editor-icon-color)',
  boxShadow: '0 0 2px 1px rgba(0, 0, 0, 0.08)',
  ':hover': {
    opacity: 0.8,
    background: 'var(--node-bg-color)'
  }
});

export const PageHeader = styled(Stack)({
  gap: 2,
  flexDirection: 'row',
  alignItems: 'center',
  borderBottom: '1px solid var(--jp-border-color2)'
});

export const StyledAlert = styled(Alert)({
  boxShadow: 'none',
  position: 'relative',
  boxSizing: 'border-box'
});

export const CustomSelect = styled(Select as any)<SelectProps<string>>(() => ({
  '& fieldset': { top: 0 },
  '& legend': { display: 'none' }
}));

export const CustomTextField = styled(TextField)<TextFieldProps>(
  ({ theme }) => ({
    '& fieldset': { top: 0 },
    '& legend': {
      display: 'none',
      color: theme.palette.grey,
      marginBottom: theme.spacing(2)
    },
    '& .MuiInputLabel-shrink': { opacity: 0 },
    '& .MuiInputLabel-root': { color: 'var(--jp-border-color0)' }
  })
);
