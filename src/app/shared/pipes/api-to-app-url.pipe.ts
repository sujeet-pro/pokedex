import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'src/environments/environment';

const slugLength = environment.pokemonApiSlug.length;
@Pipe({
  name: 'apiToAppUrl'
})
export class ApiToAppUrlPipe implements PipeTransform {

  transform(value: string): any {
    const [type, id] = value.substring(slugLength).split('/');
    switch (type) {
      // case 'stat':
      //   return `/stats/${id}`;
      // case 'pokemon':
      //   return `/pokemon/${id}`;
      // case 'ability':
      //   return `/abilities/${id}`;
      // case 'move':
      //   return `/moves/${id}`;
      // case 'type':
      //   return `/types/${id}`;
      // case 'pokemon-species':
      //   return `/species/${id}`;
      default:
        return `/${type}/${id}`;
    }
  }

}
