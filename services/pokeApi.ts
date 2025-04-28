// services/pokeApi.ts
import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2';

// --- Common Interfaces ---

// Represents a resource with a name and URL (used frequently by PokeAPI)
export interface NamedAPIResource {
  name: string;
  url: string;
}

// Represents a list response from PokeAPI
interface APIResourceList {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

// Represents detailed Pokemon information
export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: {
        front_default: string | null;
      };
      home?: {
        front_default: string | null;
      };
    };
  };
  stats: {
    base_stat: number;
    stat: NamedAPIResource;
  }[];
  types: {
    slot: number;
    type: NamedAPIResource;
  }[];
  abilities: {
    ability: NamedAPIResource;
    is_hidden: boolean;
    slot: number;
  }[];
  species: NamedAPIResource; // Link to PokemonSpecies
  // Add other fields as needed (e.g., moves, game_indices)
}

// Represents Pokemon species information (flavor text, evolution, etc.)
export interface PokemonSpecies {
    id: number;
    name: string;
    color: NamedAPIResource;
    shape: NamedAPIResource | null;
    habitat: NamedAPIResource | null;
    evolution_chain: { url: string } | null;
    flavor_text_entries: {
        flavor_text: string;
        language: NamedAPIResource;
        version: NamedAPIResource;
    }[];
    genera: {
        genus: string;
        language: NamedAPIResource;
    }[];
    capture_rate: number;
    base_happiness: number;
    growth_rate: NamedAPIResource;
    // Add other fields as needed
}

// Represents a link in the evolution chain
export interface ChainLink {
    is_baby: boolean;
    species: NamedAPIResource;
    evolution_details: any[]; // Can be detailed further if needed
    evolves_to: ChainLink[]; // Recursive structure
}

// Represents the entire evolution chain
export interface EvolutionChain {
    id: number;
    baby_trigger_item: NamedAPIResource | null;
    chain: ChainLink;
}

// Represents detailed Type information
export interface TypeDetails {
    id: number;
    name: string;
    pokemon: {
        slot: number;
        pokemon: NamedAPIResource;
    }[];
    // Add other fields like damage_relations if needed
}

// Represents Region details
export interface Region {
    id: number;
    name: string;
    locations: NamedAPIResource[];
    main_generation: NamedAPIResource;
    names: { name: string; language: NamedAPIResource }[];
    pokedexes: NamedAPIResource[]; // Important: List of Pokedexes in this region
    version_groups: NamedAPIResource[];
}

// Represents an entry in a Pokedex
export interface PokemonEntry {
    entry_number: number;
    pokemon_species: NamedAPIResource; // This is what we need
}

// Represents Pokedex details
export interface Pokedex {
    id: number;
    name: string; // e.g., "kanto", "national"
    is_main_series: boolean;
    descriptions: any[]; // Adjust if needed
    names: any[]; // Adjust if needed
    pokemon_entries: PokemonEntry[]; // The list of Pokemon
    region: NamedAPIResource | null;
    version_groups: NamedAPIResource[];
}

// --- API Fetching Functions ---

/**
 * Fetches the full list of Pokémon names and URLs.
 * Uses pagination to get all entries.
 */
export const getAllPokemon = async (limit = 1500): Promise<NamedAPIResource[]> => {
    console.log(`[pokeApi] Fetching all Pokemon (limit: ${limit})...`);
    try {
        // PokeAPI often lists more than just the base game Pokemon, adjust limit as needed
        const response = await axios.get<APIResourceList>(`${BASE_URL}/pokemon?limit=${limit}`);
        console.log(`[pokeApi] Fetched ${response.data.results.length} Pokemon names.`);
        return response.data.results;
    } catch (error) {
        console.error("[pokeApi] Error fetching all Pokémon list:", error);
        throw new Error("Could not fetch Pokémon list.");
    }
};

/**
 * Fetches detailed information for a specific Pokémon by its name.
 */
export const getPokemonDetailsByName = async (name: string): Promise<PokemonDetail | null> => {
    if (!name) {
        console.warn("[pokeApi] getPokemonDetailsByName called with empty name.");
        return null;
    }
    console.log(`[pokeApi] Fetching details for Pokemon: ${name}`);
    try {
        const response = await axios.get<PokemonDetail>(`${BASE_URL}/pokemon/${name.toLowerCase()}`);
        console.log(`[pokeApi] Successfully fetched details for ${name}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching details for Pokémon ${name}:`, error);
        // Decide whether to return null or throw based on expected handling
        // Returning null might be better for UI that can handle missing data gracefully
        return null;
        // throw new Error(`Could not fetch details for Pokémon ${name}.`);
    }
};

/**
 * Fetches detailed information for a specific Pokémon by its full URL.
 */
export const getPokemonDetailsByUrl = async (url: string): Promise<PokemonDetail | null> => {
    if (!url) {
        console.warn("[pokeApi] getPokemonDetailsByUrl called with empty URL.");
        return null;
    }
    console.log(`[pokeApi] Fetching Pokemon details from URL: ${url}`);
    try {
        const response = await axios.get<PokemonDetail>(url);
        console.log(`[pokeApi] Successfully fetched details from ${url}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching Pokémon details from URL ${url}:`, error);
        return null;
        // throw new Error(`Could not fetch Pokémon details from URL ${url}.`);
    }
};

/**
 * Fetches detailed information for a specific Pokémon species by its URL.
 */
export const getPokemonSpeciesByUrl = async (url: string): Promise<PokemonSpecies | null> => {
    if (!url) {
        console.warn("[pokeApi] getPokemonSpeciesByUrl called with empty URL.");
        return null;
    }
    console.log(`[pokeApi] Fetching Pokemon species from URL: ${url}`);
    try {
        const response = await axios.get<PokemonSpecies>(url);
        console.log(`[pokeApi] Successfully fetched species from ${url}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching Pokémon species from URL ${url}:`, error);
        return null;
        // throw new Error(`Could not fetch Pokémon species from URL ${url}.`);
    }
};

/**
 * Fetches the evolution chain details by its URL.
 */
export const getEvolutionChainByUrl = async (url: string): Promise<EvolutionChain | null> => {
    if (!url) {
        console.warn("[pokeApi] getEvolutionChainByUrl called with empty URL.");
        return null;
    }
    console.log(`[pokeApi] Fetching evolution chain from URL: ${url}`);
    try {
        const response = await axios.get<EvolutionChain>(url);
        console.log(`[pokeApi] Successfully fetched evolution chain from ${url}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching evolution chain from URL ${url}:`, error);
        return null;
        // throw new Error(`Could not fetch evolution chain from URL ${url}.`);
    }
};

/**
 * Fetches detailed information for a specific Type by its name.
 */
export const getTypeDetailsByName = async (name: string): Promise<TypeDetails | null> => {
    if (!name) {
        console.warn("[pokeApi] getTypeDetailsByName called with empty name.");
        return null;
    }
    console.log(`[pokeApi] Fetching details for Type: ${name}`);
    try {
        const response = await axios.get<TypeDetails>(`${BASE_URL}/type/${name.toLowerCase()}`);
        console.log(`[pokeApi] Successfully fetched details for type ${name}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching details for type ${name}:`, error);
        return null;
        // throw new Error(`Could not fetch details for type ${name}.`);
    }
};

/**
 * Fetches the list of all standard Pokémon types.
 */
export const getAllTypes = async (): Promise<NamedAPIResource[]> => {
    console.log("[pokeApi] Fetching all types...");
    try {
        // Fetch common types (adjust limit if needed, 18 is standard + potentially others)
        const response = await axios.get<APIResourceList>(`${BASE_URL}/type?limit=25`);
        // Filter out non-standard types PokeAPI might include
        const standardTypes = response.data.results.filter(type => type.name !== 'unknown' && type.name !== 'shadow');
        console.log(`[pokeApi] Fetched ${standardTypes.length} standard types.`);
        return standardTypes;
    } catch (error) {
        console.error("[pokeApi] Error fetching types:", error);
        throw new Error("Could not fetch type list.");
    }
};

/**
 * Fetches the list of all main game regions.
 */
export const getAllRegions = async (): Promise<NamedAPIResource[]> => {
    console.log("[pokeApi] Fetching all regions...");
    try {
        // Fetching only the first 10-12 regions usually covers main series
        const response = await axios.get<APIResourceList>(`${BASE_URL}/region?limit=12`);
        console.log(`[pokeApi] Fetched ${response.data.results.length} regions.`);
        // Filter out potentially non-game regions if needed, though PokeAPI list is usually clean
        return response.data.results;
    } catch (error) {
        console.error("[pokeApi] Error fetching regions:", error);
        throw new Error("Could not fetch region list.");
    }
};

/**
 * Fetches details of a specific region by its name.
 */
export const getRegionDetailsByName = async (name: string): Promise<Region | null> => {
    if (!name) {
        console.warn("[pokeApi] getRegionDetailsByName called with empty name.");
        return null;
    }
    console.log(`[pokeApi] Fetching details for region: ${name}`);
    try {
        const response = await axios.get<Region>(`${BASE_URL}/region/${name.toLowerCase()}`);
        console.log(`[pokeApi] Successfully fetched details for region ${name}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching details for region ${name}:`, error);
        return null;
        // throw new Error(`Could not fetch details for region ${name}.`);
    }
};

/**
 * Fetches Pokedex details by its full URL.
 */
export const getPokedexDetailsByUrl = async (url: string): Promise<Pokedex | null> => {
     if (!url) {
        console.warn("[pokeApi] getPokedexDetailsByUrl called with empty URL.");
        return null;
     }
     console.log(`[pokeApi] Fetching Pokedex details from URL: ${url}`);
    try {
        const response = await axios.get<Pokedex>(url);
        console.log(`[pokeApi] Successfully fetched Pokedex details from ${url}.`);
        return response.data;
    } catch (error) {
        console.error(`[pokeApi] Error fetching Pokedex details from ${url}:`, error);
        return null;
        // throw new Error(`Could not fetch Pokedex details from ${url}.`);
    }
};

/**
 * Fetches the list of Pokémon species for a specific region name.
 * This involves fetching region details, then its primary Pokedex, then extracting entries.
 */
export const getPokemonByRegionName = async (regionName: string): Promise<NamedAPIResource[]> => {
    if (!regionName) {
        console.warn("[pokeApi] getPokemonByRegionName called with empty region name.");
        return [];
    }
    console.log(`[pokeApi] Getting Pokemon list for region: ${regionName}`);
    try {
        const regionDetails = await getRegionDetailsByName(regionName);
        if (!regionDetails || regionDetails.pokedexes.length === 0) {
            console.warn(`[pokeApi] No Pokedexes found for region ${regionName}.`);
            return [];
        }

        // Strategy: Prioritize a Pokedex named similarly to the region, or the first one.
        // This might need adjustment based on PokeAPI structure for specific regions.
        let primaryPokedexUrl = regionDetails.pokedexes[0]?.url; // Default to first
        const regionSpecificPokedex = regionDetails.pokedexes.find(p => p.name === regionName.toLowerCase());
        if (regionSpecificPokedex) {
            primaryPokedexUrl = regionSpecificPokedex.url;
            console.log(`[pokeApi] Found region-specific Pokedex: ${regionSpecificPokedex.name}`);
        } else {
             console.log(`[pokeApi] Using first listed Pokedex: ${regionDetails.pokedexes[0]?.name}`);
        }


        if (!primaryPokedexUrl) {
             console.warn(`[pokeApi] Primary Pokedex URL could not be determined for region ${regionName}.`);
             return [];
        }

        const pokedexDetails = await getPokedexDetailsByUrl(primaryPokedexUrl);
        if (!pokedexDetails) {
            console.warn(`[pokeApi] Could not fetch Pokedex details for region ${regionName} from URL: ${primaryPokedexUrl}`);
            return [];
        }

        // Extract the pokemon species list
        const pokemonList = pokedexDetails.pokemon_entries.map(entry => entry.pokemon_species);
        console.log(`[pokeApi] Found ${pokemonList.length} Pokemon entries for region ${regionName}.`);
        return pokemonList;

    } catch (error) {
        console.error(`[pokeApi] Failed to get Pokemon list for region ${regionName}:`, error);
        // Return empty list on error to allow UI to show "not found" instead of crashing
        return [];
        // throw new Error(`Could not get Pokemon for region ${regionName}.`);
    }
};
