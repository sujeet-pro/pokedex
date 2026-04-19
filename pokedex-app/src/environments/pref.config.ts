import { IPreferenceOptions } from 'src/app/models/preference.model';

export const prefOptions: IPreferenceOptions = {
  themes: [{
    color: {
      primary: '#3463ad',
    },
    isDefault: true,
    themeClass: 'theme-blue',
    themeName: 'Blue theme'
  }, {
    color: {
      primary: '#ffcb02',
    },
    isDefault: false,
    themeClass: 'theme-yellow',
    themeName: 'Yellow theme'
  }, {
    color: {
      primary: '#ef5350',
    },
    isDefault: false,
    themeClass: 'theme-red',
    themeName: 'Red theme'
  }],
  fonts: [{
    fontClass: 'font-xs',
    fontSize: 10,
    fontText: 'Extra Small Font',
    isDefault: false
  }, {
    fontClass: 'font-s',
    fontSize: 12,
    fontText: 'Small Font',
    isDefault: false
  }, {
    fontClass: 'font-n',
    fontSize: 14,
    fontText: 'Normal Font',
    isDefault: true
  }, {
    fontClass: 'font-l',
    fontSize: 16,
    fontText: 'Large Font',
    isDefault: false
  }, {
    fontClass: 'font-xl',
    fontSize: 18,
    fontText: 'Extra Large Font',
    isDefault: false
  }],
  darkMode: {
    default: true,
    active: 'night-mode',
    inactive: 'day-mode'
  },
  direction: 'ltr'
};
