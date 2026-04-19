import { Injectable } from '@angular/core';
import { PreferenceService } from './preference.service';
import * as localforage from 'localforage';
@Injectable({
  providedIn: 'root'
})
export class InitService {

  constructor(
    private prefSvc: PreferenceService
  ) { }

  async init() {
    try {
      localforage.config({
        driver: localforage.INDEXEDDB, // Force WebSQL; same as using setDriver()
        name: 'pokemon-explorer-caching',
        version: 1.0,
        size: 4980736, // Size of database, in bytes. WebSQL-only for now.
        storeName: 'key_value_pairs', // Should be alphanumeric, with underscores.
        description: 'In application caching for pokemon explorer'
      });
      await this.prefSvc.init();
      return true;
    } catch (error) {
      return false;
    }

  }
}
