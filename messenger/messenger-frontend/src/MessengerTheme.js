import spacing from 'material-ui/styles/spacing';
import {darken} from "material-ui/utils/colorManipulator";

export const Colors = {
    messenger: {
      primary: '#3F51B5',
      primary3: '#C5CAE9',
    },
    gray: {
        dark: 'hsl(218, 12%, 35%)',
        normal: 'hsl(218, 12%, 50%)',
        light: 'hsl(218, 12%, 60%)',
        xtral: 'hsl(218, 12%, 90%)',
    },
};


export default {
    spacing: spacing,
    fontFamily: 'Roboto, sans-serif',
    borderRadius: 2,
    palette: {
        primary1Color: '#3F51B5',
        primary2Color: '#303F9F',
        primary3Color: '#C5CAE9',
        accent1Color: '#757AE9',
        accent2Color: '#B2FF59',
        accent3Color: '#B2FF59',
        textColor: Colors.gray.dark,
        secondaryTextColor: Colors.gray.light,
        alternateTextColor: '#FFFFFF',
        canvasColor: darken('#FFFFFF', 0.01),
        borderColor: Colors.gray.xtral,
        disabledColor: Colors.gray.dark,
        pickerHeaderColor: darken('#FFFFFF', 0.12),
        clockCircleColor: darken('#FFFFFF', 0.12),
    },
};
