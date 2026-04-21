import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#22b7ff',
            contrastText: '#fff'
        },
        secondary: {
            main: '#4e6bff'
        },
        background: {
            default: '#071423',
            paper: '#0b1b30'
        },
        text: {
            primary: '#f8fafc',
            secondary: '#b8d8ff'
        }
    },
    typography: {
        fontFamily: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'].join(','),
        button: {
            textTransform: 'none'
        }
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 20
                }
            }
        }
    }
});

export default theme;
