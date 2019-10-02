import { Injectable } from '@angular/core';
import { IActivePreference, IFont, ITheme, IPreferenceOptions } from '../models/preference.model';
import { ReplaySubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private activePref: IActivePreference | null = null;
  private prefOptions: IPreferenceOptions = environment.prefOptions;

  private elem = document.querySelector('html');
  private prefChangeNotifier = new ReplaySubject<IActivePreference>(1);

  constructor() { }

  get pref(): IActivePreference {
    return this.activePref || this.defaultActivePref;
  }
  get options(): IPreferenceOptions {
    return this.prefOptions;
  }
  get notifier(): Observable<IActivePreference> {
    return this.prefChangeNotifier.asObservable();
  }
  async init() {
    try {
      const pref = await localforage.getItem<IActivePreference>(environment.userPrefKey);
      this.updatePref(pref, false);
    } catch (err) {
      this.updatePref(this.defaultActivePref, false);
    }
  }

  updatePref(partialPref: Partial<IActivePreference> = this.defaultActivePref, sync = true) {
    let hasUpdates = false;
    if (partialPref.theme && partialPref.theme.themeClass &&
      this.prefOptions.themes.some(theme => partialPref.theme && theme.themeClass === partialPref.theme.themeClass) &&
      (!this.activePref || (this.activePref && this.activePref.theme.themeClass !== partialPref.theme.themeClass))) {
      this.updateTheme(partialPref.theme);
      hasUpdates = true;
    }
    if (partialPref.font && partialPref.font.fontClass &&
      this.prefOptions.fonts.some(font => partialPref.font && font.fontClass === partialPref.font.fontClass) &&
      (!this.activePref || (this.activePref && this.activePref.font.fontClass !== partialPref.font.fontClass))) {
      this.updateFont(partialPref.font);
      hasUpdates = true;
    }
    if (partialPref.isDarkMode !== undefined && (!this.activePref ||
      (this.activePref && this.activePref.isDarkMode !== partialPref.isDarkMode))) {
      this.updateDarkMode(partialPref.isDarkMode);
      hasUpdates = true;
    }
    if (!this.activePref || (this.activePref && this.activePref.direction !== partialPref.direction)) {
      this.updateDir(partialPref.direction);
      hasUpdates = true;
    }
    if (hasUpdates) {
      this.activePref = {
        ...(this.activePref || this.defaultActivePref),
        ...partialPref
      };
      if (sync) {
        localforage.setItem(environment.userPrefKey, this.activePref);
      }
      this.prefChangeNotifier.next(this.activePref);
    }

  }

  private updateTheme(theme: ITheme) {
    this.elem.classList.remove(...this.prefOptions.themes.map(u => u.themeClass));
    this.elem.classList.add(theme.themeClass);
  }
  private updateFont(font: IFont) {
    this.elem.classList.remove(...this.prefOptions.fonts.map(u => u.fontClass));
    this.elem.classList.add(font.fontClass);
  }
  private updateDarkMode(isDarkMode) {
    this.elem.classList.remove(this.prefOptions.darkMode.active, this.prefOptions.darkMode.inactive);
    this.elem.classList.add(isDarkMode ? this.prefOptions.darkMode.active : this.prefOptions.darkMode.inactive);
  }
  private updateDir(dir) {
    this.elem.setAttribute('dir', dir);
  }

  private get defaultActivePref(): IActivePreference {
    return {
      theme: this.prefOptions.themes.find(theme => theme.isDefault) || this.prefOptions.themes[0],
      font: this.prefOptions.fonts.find(font => font.isDefault) || this.prefOptions.fonts[0],
      direction: this.prefOptions.direction || 'ltr',
      isDarkMode: this.prefOptions.darkMode && this.prefOptions.darkMode.default || false
    };
  }
}
