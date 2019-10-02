import { Component, OnInit } from '@angular/core';
import { PreferenceService } from 'src/app/services/preference.service';
import { ITheme, IFont, IActivePreference } from '../../models/preference.model';

@Component({
  selector: 'pokedex-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {
  activePref: IActivePreference;
  themes: ITheme[] = [];
  fonts: IFont[] = [];

  constructor(
    private prefSvc: PreferenceService
  ) { }

  ngOnInit() {
    this.activePref = this.prefSvc.pref;
    this.fonts = this.prefSvc.options.fonts;
    this.themes = this.prefSvc.options.themes;
    this.prefSvc.notifier.subscribe(activePref => {
      this.activePref = activePref;
    });
  }
  updateTheme(theme: ITheme) {
    this.prefSvc.updatePref({ theme });
  }
  updateFont(font: IFont) {
    this.prefSvc.updatePref({ font });
  }
  toggleDarkMode() {
    const isDarkMode = !this.activePref.isDarkMode;
    this.prefSvc.updatePref({ isDarkMode });
  }
  toggleContentDir() {
    const direction = this.activePref.direction === 'ltr' ? 'rtl' : 'ltr';
    this.prefSvc.updatePref({ direction });
  }
}
