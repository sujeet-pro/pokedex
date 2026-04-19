# Pokédex

This is a web pokédex, inspired from the original one. The Pokédex is an electronic device designed to catalogue and provide information regarding the various species of Pokémon featured in the Pokémon video game, anime and manga series.

## Features of this Pokédex
### In general
 * Responsive web application
 * All the apis are being cached.
 * This can be build using `npm run build:prod` for prod build
 * For serving it locally `npm start` would work
 * This is being deployed to `firebase hosting`
 * This deployment is automated using `travis`
 * For analytics,  `Google analytics` is being used with default settings.

### Personalization

* Support for multiple themes
  * Blue theme
  * Yellow theme
  * Red theme
  * On theme change, the theme color for the browser bar (in android devices) also updates.
* Support for day and night mode
* Support for different font-sizes (5 -> extra small, small, medium, large and extra-large)
* Content direction change (left-to-right & left-to-right)

### Pokémon: Search and Featured
* Homepage features `Pokémon of the day`.
* Autocomplete on names at home page. selecting one will directly take you to Pokémon details.
* Search Page: Will provide list of Pokémon, based on search query. Examples
  * Searching ["Ven"](https://Pokédex.sujeetjaiswal.com/search?q=ven) for Pokémon with `ven` in their name
  * Searching ["All"](https://Pokédex.sujeetjaiswal.com/search?q=all) for listing all the Pokémon
  * Searchin ["qwert"](https://Pokédex.sujeetjaiswal.com/search?q=qerty) will not match and results in a no content message.

### Other Details
* The application follow the following url pattern `https://Pokédex.sujeetjaiswal.com/:content-type/:content-id`
  * Examples:
  * Pokémon: venusaur[https://Pokédex.sujeetjaiswal.com/Pokémon/venusaur](https://Pokédex.sujeetjaiswal.com/Pokémon/venusaur)
  * Type: poison [https://Pokédex.sujeetjaiswal.com/Pokémon-species/3](https://Pokédex.sujeetjaiswal.com/Pokémon-species/3)
  * [https://Pokédex.sujeetjaiswal.com/Pokémon-species/3](https://Pokédex.sujeetjaiswal.com/Pokémon-species/3)
  * Form: venusaur[https://Pokédex.sujeetjaiswal.com/Pokémon-form/3](https://Pokédex.sujeetjaiswal.com/Pokémon-form/3)
  * Ability: overgrow [https://Pokédex.sujeetjaiswal.com/ability/65](https://Pokédex.sujeetjaiswal.com/ability/65)
  * For an invalid type or id, the page will not render anything and shows the corresponding error of type or id.
  * For an invalid route, it would display a [page-not-found](https://Pokédex.sujeetjaiswal.com/invalid-page) error page

## Performance consideration
* All the Pokéapi is cached in the indexed DB.
* All the apis, when fetching the data i.e. in progress will also be locally cached in memory, in order to avoid any duplicate request.

## Thing to do:
* Creating user friendly pages for other pages, similar to that of pokemon details page. (eg. ability, move, type, species, etc).
* Making it a progressive web application. (All the configurations are done, only the registry is in pending state)

