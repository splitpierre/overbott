/* eslint-disable react/jsx-no-constructed-context-values */
import { createTheme } from '@mui/material';
import { createContext, ReactNode, useMemo, useState } from 'react';
import colorSchemes from '../../main/data/color-schemes';
import { ThemeContextProps } from '../../main/types/app-types';

interface ThemeContextProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext({} as ThemeContextProps);

function ThemeContextProvider({
  children,
  windowInject,
  // eslint-disable-next-line react/require-default-props
}: ThemeContextProviderProps & { windowInject?: any }) {
  let activeWindow: any;
  try {
    if (window) {
      // console.log('test window', window);
    }
    activeWindow = window;
  } catch (error) {
    if (windowInject) {
      activeWindow = windowInject;
    } else {
      console.error('no window');
      throw new Error('no window');
    }
  }
  const colorScheme = activeWindow.electron.store.get('colorScheme')
    ? colorSchemes[
        activeWindow.electron.store.get(
          'colorScheme',
        ) as keyof typeof colorSchemes
      ]
    : colorSchemes.overBott;
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(
    activeWindow.electron.store.get('themeMode') || 'dark',
  );

  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  // const defaultTheme = createTheme({});
  const customThemeMain = createTheme({
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*::-webkit-scrollbar': {
            width: '0.5em', // Adjust as needed
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor:
              themeMode === 'dark'
                ? colorScheme.dark.primary
                : colorScheme.light.primary, // Change scrollbar thumb color
            borderRadius: '4px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor:
              themeMode === 'dark'
                ? colorScheme.dark.secondary
                : colorScheme.light.secondary, // Change scrollbar track color
          },
        },
      },
    },
    palette: {
      mode: themeMode,
      primary: {
        main:
          themeMode === 'dark'
            ? colorScheme.dark.primary
            : colorScheme.light.primary,
      },
      tonalOffset: 0.2,
      background: {
        // default: themeMode === '0' ? '#f5f5f5' : '#121212',
        paper:
          themeMode === 'dark'
            ? colorScheme.dark.backgroundPaper
            : colorScheme.light.backgroundPaper,
      },
      secondary: {
        main:
          themeMode === 'dark'
            ? colorScheme.dark.secondary
            : colorScheme.light.secondary,
      },
    },
  });
  const customThemeGadget = createTheme({
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*::-webkit-scrollbar': {
            width: '0.5em', // Adjust as needed
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor:
              themeMode === 'dark'
                ? colorScheme.dark.primary
                : colorScheme.light.primary, // Change scrollbar thumb color
            borderRadius: '4px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor:
              themeMode === 'dark'
                ? colorScheme.dark.secondary
                : colorScheme.light.secondary, // Change scrollbar track color
          },
        },
      },
    },
    palette: {
      mode: themeMode,
      primary: {
        main: colorScheme.dark.primary,
      },
      tonalOffset: 0.2,
      background: {
        default: 'transparent',
        paper:
          themeMode === 'dark'
            ? colorScheme.dark.backgroundPaper
            : colorScheme.light.backgroundPaper,
      },
      secondary: {
        main: colorScheme.dark.secondary,
      },
    },
  });
  const memoValue = useMemo(
    () => ({
      customThemeMain,
      customThemeGadget,
      themeMode,
      setThemeMode,
      colorScheme,
      open,
      handleDrawerOpen,
      handleDrawerClose,
    }),
    [customThemeMain, customThemeGadget, themeMode, colorScheme, open],
  );
  return (
    <ThemeContext.Provider value={memoValue}>{children}</ThemeContext.Provider>
  );
}

export { ThemeContext, ThemeContextProvider };
