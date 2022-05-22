import getResolverUtilMethods from './utils.js'

const connections = [
  'AbilityConnection',
  'BerryConnection',
  'BerryFirmnessConnection',
  'BerryFlavorConnection',
  'CharacteristicConnection',
  'ContestEffectConnection',
  'ContestTypeConnection',
  'EggGroupConnection',
  'EncounterConditionConnection',
  'EncounterConditionValueConnection',
  'EncounterMethodConnection',
  'EvolutionChainConnection',
  'EvolutionTriggerConnection',
  'GenderConnection',
  'GenerationConnection',
  'GrowthRateConnection',
  'ItemConnection',
  'ItemAttributeConnection',
  'ItemCategoryConnection',
  'ItemFlingEffectConnection',
  'ItemPocketConnection',
  'LanguageConnection',
  'LocationConnection',
  'LocationAreaConnection',
  'MachineConnection',
  'MoveConnection',
  'MoveAilmentConnection',
  'MoveBattleStyleConnection',
  'MoveCategoryConnection',
  'MoveDamageClassConnection',
  'MoveLearnMethodConnection',
  'MoveTargetConnection',
  'NatureConnection',
  'PalParkAreaConnection',
  'PokeathlonStatConnection',
  'PokedexConnection',
  'PokemonConnection',
  'PokemonColorConnection',
  'PokemonFormConnection',
  'PokemonHabitatConnection',
  'PokemonShapeConnection',
  'PokemonSpeciesConnection',
  'RegionConnection',
  'StatConnection',
  'SuperContestEffectConnection',
  'TypeConnection',
  'VersionConnection',
  'VersionGroupConnection',
]
const namesOnly = ['names']
const namesAndDescription = ['names', 'descriptions']
const localizedFields = {
  names: [
    'Ability',
    'BerryFirmness',
    'BerryFlavor',
    'ContestType',
    'EggGroup',
    'EncounterCondition',
    'EncounterConditionValue',
    'EncounterMethod',
    'EvolutionTrigger',
    'Generation',
    'Item',
    'ItemAttribute',
    'ItemCategory',
    'ItemPocket',
    'Language',
    'Location',
    'LocationArea',
    'Move',
    'MoveAilment',
    'MoveBattleStyle',
    'MoveDamageClass',
    'MoveLearnMethod',
    'MoveTarget',
    'Nature',
    'PalParkArea',
    'PokeathlonStat',
    'Pokedex',
    'PokemonColor',
    'PokemonForm',
    'PokemonHabitat',
    'PokemonShape',
    'PokemonSpecies',
    'Region',
    'Stat',
    'Type',
    'Version',
  ],
  descriptions: [
    'Characteristic',
    'GrowthRate',
    'ItemAttribute',
    'MoveCategory',
    'MoveDamageClass',
    'MoveLearnMethod',
    'MoveTarget',
    'Pokedex',
  ],
  form_names: ['PokemonForm'],
  awesome_names: ['PokemonShape'],
  form_descriptions: ['PokemonSpecies'],
  effect_entries: [
    'Ability',
    'ContestEffect',
    'VersionGroupedLocalizedEffect',
    'Item',
    'ItemFlingEffect',
    'Move',
    'Move_PastValues',
  ],
  flavor_text_entries: [
    'Ability',
    'ContestEffect',
    'Item',
    'Move',
    'PokemonSpecies',
    'SuperContestEffect',
  ],
}

/**
 *
 * @param {(apiPath: string) => any} getFromApi
 * @param {(folder: string, id?: number) => string} getApiPathFor
 * @returns
 */
export default function getResolvers(getFromApi, getApiPathFor) {
  const { getAll, getConnection, getOne, getByUrl } = getResolverUtilMethods(
    getFromApi,
    getApiPathFor,
  )
  const resolvers = {
    Query: {
      allAbility: getAll('ability'),
      ability: getOne('ability'),

      allBerry: getAll('berry'),
      berry: getOne('berry'),

      allBerryFirmness: getAll('berry-firmness'),
      berryFirmness: getOne('berry-firmness'),

      allBerryFlavor: getAll('berry-flavor'),
      berryFlavor: getOne('berry-flavor'),

      allCharacteristic: getAll('characteristic'),
      characteristic: getOne('characteristic'),

      allContestEffect: getAll('contest-effect'),
      contestEffect: getOne('contest-effect'),

      allContestType: getAll('contest-type'),
      contestType: getOne('contest-type'),

      allEggGroup: getAll('egg-group'),
      eggGroup: getOne('egg-group'),

      allEncounterCondition: getAll('encounter-condition'),
      encounterCondition: getOne('encounter-condition'),

      allEncounterConditionValue: getAll('encounter-condition-value'),
      encounterConditionValue: getOne('encounter-condition-value'),

      allEncounterMethod: getAll('encounter-method'),
      encounterMethod: getOne('encounter-method'),

      allEvolutionChain: getAll('evolution-chain'),
      evolutionChain: getOne('evolution-chain'),

      allEvolutionTrigger: getAll('evolution-trigger'),
      evolutionTrigger: getOne('evolution-trigger'),

      allGender: getAll('gender'),
      gender: getOne('gender'),

      allGeneration: getAll('generation'),
      generation: getOne('generation'),

      allGrowthRate: getAll('growth-rate'),
      growthRate: getOne('growth-rate'),

      allItem: getAll('item'),
      item: getOne('item'),

      allItemAttribute: getAll('item-attribute'),
      itemAttribute: getOne('item-attribute'),

      allItemCategory: getAll('item-category'),
      itemCategory: getOne('item-category'),

      allItemFlingEffect: getAll('item-fling-effect'),
      itemFlingEffect: getOne('item-fling-effect'),

      allItemPocket: getAll('item-pocket'),
      itemPocket: getOne('item-pocket'),

      allLanguage: getAll('language'),
      language: getOne('language'),

      allLocation: getAll('location'),
      location: getOne('location'),

      allLocationArea: getAll('location-area'),
      locationArea: getOne('location-area'),

      allMachine: getAll('machine'),
      machine: getOne('machine'),

      allMove: getAll('move'),
      move: getOne('move'),

      allMoveAilment: getAll('move-ailment'),
      moveAilment: getOne('move-ailment'),

      allMoveBattleStyle: getAll('move-battle-style'),
      moveBattleStyle: getOne('move-battle-style'),

      allMoveCategory: getAll('move-category'),
      moveCategory: getOne('move-category'),

      allMoveDamageClass: getAll('move-damage-class'),
      moveDamageClass: getOne('move-damage-class'),

      allMoveLearnMethod: getAll('move-learn-method'),
      moveLearnMethod: getOne('move-learn-method'),

      allMoveTarget: getAll('move-target'),
      moveTarget: getOne('move-target'),

      allNature: getAll('nature'),
      nature: getOne('nature'),

      allPalParkArea: getAll('pal-park-area'),
      palParkArea: getOne('pal-park-area'),

      allPokeathlonStat: getAll('pokeathlon-stat'),
      pokeathlonStat: getOne('pokeathlon-stat'),

      allPokedex: getAll('pokedex'),
      pokedex: getOne('pokedex'),

      allPokemon: getAll('pokemon'),
      pokemon: getOne('pokemon'),

      allPokemonColor: getAll('pokemon-color'),
      pokemonColor: getOne('pokemon-color'),

      allPokemonForm: getAll('pokemon-form'),
      pokemonForm: getOne('pokemon-form'),

      allPokemonHabitat: getAll('pokemon-habitat'),
      pokemonHabitat: getOne('pokemon-habitat'),

      allPokemonShape: getAll('pokemon-shape'),
      pokemonShape: getOne('pokemon-shape'),

      allPokemonSpecies: getAll('pokemon-species'),
      pokemonSpecies: getOne('pokemon-species'),

      allRegion: getAll('region'),
      region: getOne('region'),

      allStat: getAll('stat'),
      stat: getOne('stat'),

      allSuperContestEffect: getAll('super-contest-effect'),
      superContestEffect: getOne('super-contest-effect'),

      allType: getAll('type'),
      type: getOne('type'),

      allVersion: getAll('version'),
      version: getOne('version'),

      allVersionGroup: getAll('version-group'),
      versionGroup: getOne('version-group'),
    },

    Pokemon: {
      async encounters(parent, args, context, info) {
        return getByUrl(parent.location_area_encounters)
      },
    },
  }
  connections.forEach(type => {
    ensureObj(resolvers, type)
    resolvers[type].details = getConnection()
  })

  Object.entries(localizedFields)
    .flatMap(([field, types]) => types.map(type => [field, type]))
    .forEach(([field, type]) => {
      ensureObj(resolvers, type)
      resolvers[type][field] = (parent, args, context, info) => {
        if (args.language) {
          return parent[field].filter(filterByLanguage(args.language))
        }
        return parent[field]
      }
    })
  return resolvers
}

function filterByLanguage(languageName) {
  return localizedObj => localizedObj?.language?.name === languageName
}
function ensureObj(obj, key) {
  if (!obj[key]) {
    obj[key] = {}
  }
}
