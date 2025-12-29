import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';

export const useTheme = () => {
    const { theme } = useApp();

    const colors = theme === 'dark' ? { ...COLORS, ...COLORS.dark } : COLORS;

    return { colors, theme };
};
