// app/(tabs)/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TextInput, Dimensions, Pressable, Platform
} from 'react-native';
import { Link } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../context/ThemeContext';
import {
    getAllPokemon, NamedAPIResource, getTypeDetailsByName,
    getAllTypes,
    getAllRegions,
    getPokemonByRegionName
} from '../../services/pokeApi';
import PokemonListItem from '../../components/PokemonListItem';
import { capitalizeFirstLetter } from '../../utils/helpers';

// --- Constants and Calculation Functions ---
const ITEM_MARGIN_HORIZONTAL = 5; // Ensure this matches PokemonListItem margin
const MIN_ITEM_WIDTH = 150;
const LIST_PADDING_HORIZONTAL = 8;
const EFFECTIVE_ITEM_WIDTH = MIN_ITEM_WIDTH + (ITEM_MARGIN_HORIZONTAL * 2);
const calculateNumColumns = (screenWidth: number): number => {
  const availableWidth = screenWidth - (LIST_PADDING_HORIZONTAL * 2);
  const calculatedCols = Math.floor(availableWidth / EFFECTIVE_ITEM_WIDTH);
  return Math.max(2, calculatedCols);
};
type ListItemData = NamedAPIResource | { name: string; isPlaceholder: true };
// --- End Constants ---


const PokemonListScreen = () => {
  const { colors, theme, toggleTheme } = useTheme();
  // --- State variables ---
  const [allPokemon, setAllPokemon] = useState<NamedAPIResource[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<NamedAPIResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<NamedAPIResource[]>([]);
  const [availableRegions, setAvailableRegions] = useState<NamedAPIResource[]>([]);
  const [loadingFiltersOptions, setLoadingFiltersOptions] = useState(true); // Renamed for clarity
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  // --- End State ---

  // --- Effects ---
  // Update Screen Width
  useEffect(() => {
    const updateLayout = (dims: { window: { width: number; height: number } }) => setScreenWidth(dims.window.width);
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  // Calculate Number of Columns
  const numColumns = useMemo(() => calculateNumColumns(screenWidth), [screenWidth]);

  // Fetch Initial Data (Pokemon, Types, Regions)
  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        setLoading(true); setLoadingFiltersOptions(true); setError(null);
        const [pokemonList, typeList, regionList] = await Promise.all([ getAllPokemon(), getAllTypes(), getAllRegions() ]);
        if (isMounted) {
          setAllPokemon(pokemonList); setFilteredPokemon(pokemonList);
          setAvailableTypes(typeList); setAvailableRegions(regionList);
        }
      } catch (err: any) { if (isMounted) setError(err.message || 'Failed to load initial data.'); }
      finally { if (isMounted) { setLoading(false); setLoadingFiltersOptions(false); } }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  // Apply Filters (Search, Type, Region)
  useEffect(() => {
    // Don't run if initial data or options are still loading
    if (loading || loadingFiltersOptions) return;
    let isMounted = true;
    const applyFilters = async () => {
      setIsApplyingFilters(true); setError(null);
      try {
        let baseList: NamedAPIResource[] = allPokemon; // Start with all pokemon
        let regionPokemonSet: Set<string> | null = null;
        if (selectedRegion) {
            const regionPokemonList = await getPokemonByRegionName(selectedRegion);
            regionPokemonSet = new Set(regionPokemonList.map(p => p.name));
        }
        let typePokemonSet: Set<string> | null = null;
        if (selectedType) {
            const typeDetails = await getTypeDetailsByName(selectedType);
            const typePokemonList = typeDetails?.pokemon?.map(p => p.pokemon) ?? [];
            typePokemonSet = new Set(typePokemonList.map(p => p.name));
        }
        // Filter base list by region and type
        let combinedFilteredList = baseList.filter(pokemon => {
            const isInRegion = regionPokemonSet ? regionPokemonSet.has(pokemon.name) : true;
            const isInType = typePokemonSet ? typePokemonSet.has(pokemon.name) : true;
            return isInRegion && isInType;
        });
        // Apply search term filter
        const lowerSearchTerm = searchTerm.toLowerCase();
        const finalResults = !searchTerm ? combinedFilteredList : combinedFilteredList.filter(p => p.name.toLowerCase().includes(lowerSearchTerm));
        if (isMounted) setFilteredPokemon(finalResults);
      } catch (err: any) { if (isMounted) { setError(err.message || 'Failed to apply filters.'); setFilteredPokemon([]); } }
      finally { if (isMounted) setIsApplyingFilters(false); }
    };
    applyFilters();
    return () => { isMounted = false; };
  }, [searchTerm, selectedType, selectedRegion, allPokemon, loading, loadingFiltersOptions]); // Added loadingFiltersOptions dependency
  // --- End Effects ---


  // --- Prepare Data with Placeholders ---
  const listDataWithPlaceholders = useMemo((): ListItemData[] => {
    const currentData = filteredPokemon; // Use the filtered list
    if (!currentData || currentData.length === 0) return [];
    const remainder = currentData.length % numColumns;
    const placeholdersNeeded = remainder === 0 ? 0 : numColumns - remainder;
    const placeholders: ListItemData[] = Array.from({ length: placeholdersNeeded }, (_, i) => ({ name: `placeholder_${currentData.length + i}`, isPlaceholder: true }));
    return [...currentData, ...placeholders];
  }, [filteredPokemon, numColumns]); // Depend on filteredPokemon
  // --- End Data Preparation ---


  // --- Render Item Function ---
  const renderItem = ({ item }: { item: ListItemData }) => {
    // Handle Placeholders
    if ('isPlaceholder' in item && item.isPlaceholder) {
      return <View style={styles.placeholderItem} />; // Use placeholder style
    }
    // Handle Real Pokemon Items
    const pokemonItem = item as NamedAPIResource;
    if (!pokemonItem?.name || !pokemonItem?.url) return null;
    // Use Link with asChild
    return ( <Link href={`/pokemon/${pokemonItem.name}`} asChild><PokemonListItem name={pokemonItem.name} url={pokemonItem.url} /></Link> );
  };
  // --- End Render Item Function ---

  const keyExtractor = (item: ListItemData) => item.name;

  // --- Loading / Error / Empty States ---
  const isOverallLoading = loading || loadingFiltersOptions; // Check both initial loads
  if (isOverallLoading) { return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>; }
  const currentError = error;
  const isFiltering = isApplyingFilters; // Use the specific state for filter processing
  const noResults = !isFiltering && !currentError && filteredPokemon.length === 0; // Check filteredPokemon length
  // --- End Loading / Error / Empty States ---


  // --- Main Render ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* --- Search and Filter Area --- */}
      <View style={[styles.controlsContainer, { borderBottomColor: colors.border }]}>
        {/* Search Row (remains the same) */}
        <View style={styles.searchRow}>
            <TextInput style={[ styles.searchBar, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2, } ]} placeholder="Search Pokémon..." placeholderTextColor={colors.text + '80'} value={searchTerm} onChangeText={setSearchTerm} />
            <Pressable onPress={toggleTheme} style={[styles.themeToggleButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.themeButtonText, { color: colors.primary }]}>{theme === 'light' ? '🌙' : '☀️'}</Text>
            </Pressable>
        </View>

        {/* --- MODIFIED Filter Pickers Row --- */}
        <View style={styles.filterRow}>
            {/* Type Picker */}
            <View style={[styles.pickerWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Display Text for Selected Value */}
                <Text style={[styles.pickerSelectedText, { color: colors.text }]} numberOfLines={1}>
                    {selectedType ? capitalizeFirstLetter(selectedType) : "All Types"}
                </Text>
                {/* Custom Arrow */}
                <Text style={[styles.pickerArrow, { color: colors.text + 'aa' }]}>▼</Text>
                {/* Hidden Picker for Functionality */}
                <Picker
                    selectedValue={selectedType}
                    onValueChange={(itemValue) => setSelectedType(itemValue === "all" ? null : itemValue)}
                    style={styles.hiddenPicker} // Apply hidden style
                    dropdownIconColor={colors.text}
                    mode="dropdown"
                    // enabled={!isFiltering} // Optional: disable while applying filters
                >
                    <Picker.Item label="All Types" value="all" style={styles.pickerItem} />
                    {availableTypes.map(type => ( <Picker.Item key={type.name} label={capitalizeFirstLetter(type.name)} value={type.name} style={styles.pickerItem} /> ))}
                </Picker>
            </View>

            {/* Region Picker */}
            <View style={[styles.pickerWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                 {/* Display Text for Selected Value */}
                 <Text style={[styles.pickerSelectedText, { color: colors.text }]} numberOfLines={1}>
                    {selectedRegion ? capitalizeFirstLetter(selectedRegion) : "All Regions"}
                </Text>
                 {/* Custom Arrow */}
                 <Text style={[styles.pickerArrow, { color: colors.text + 'aa' }]}>▼</Text>
                 {/* Hidden Picker for Functionality */}
                <Picker
                    selectedValue={selectedRegion}
                    onValueChange={(itemValue) => setSelectedRegion(itemValue === "all" ? null : itemValue)}
                    style={styles.hiddenPicker} // Apply hidden style
                    dropdownIconColor={colors.text}
                    mode="dropdown"
                    // enabled={!isFiltering} // Optional: disable while applying filters
                >
                    <Picker.Item label="All Regions" value="all" style={styles.pickerItem} />
                    {availableRegions.map(region => ( <Picker.Item key={region.name} label={capitalizeFirstLetter(region.name)} value={region.name} style={styles.pickerItem} /> ))}
                </Picker>
            </View>
        </View>
        {/* --- END MODIFIED Filter Pickers Row --- */}
      </View>
      {/* --- End Search and Filter Area --- */}


      {/* --- Loading/Error/List/Empty States --- */}
      {isFiltering && <ActivityIndicator style={styles.inlineLoader} size="small" color={colors.primary} />}
      {currentError && !isFiltering && <Text style={[styles.infoText, { color: colors.error || 'red' }]}>{currentError}</Text>}
      {noResults && ( <Text style={[styles.infoText, { color: colors.text }]}>No Pokémon found matching criteria.</Text> )}
      {/* Render list only if not loading filters and no error, OR if there's data */}
      {(!isFiltering && !currentError && listDataWithPlaceholders.length > 0) && (
        <FlatList
          key={numColumns}
          data={listDataWithPlaceholders} // Use data with placeholders
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          numColumns={numColumns}
          ListEmptyComponent={null} // Handled above
          initialNumToRender={numColumns * 5}
          maxToRenderPerBatch={numColumns * 3}
          windowSize={11}
          removeClippedSubviews={true}
        />
      )}
      {/* --- End Loading/Error/List/Empty States --- */}
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  // --- Control Area Styles ---
  controlsContainer: { paddingBottom: 10, paddingHorizontal: 10, paddingTop: 10, borderBottomWidth: 1, },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, },
  searchBar: { flex: 1, height: 45, borderWidth: 1, paddingHorizontal: 15, borderRadius: 25, fontSize: 16, marginRight: 10, },
  themeToggleButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center', height: 45, },
  themeButtonText: { fontSize: 16, fontWeight: 'bold', },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', },

  // --- UPDATED Picker Styles ---
  pickerWrapper: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderRadius: 25,
    marginHorizontal: 5,
    flexDirection: 'row', // Align text and arrow
    alignItems: 'center',
    paddingLeft: 15, // More padding on the left for text
    paddingRight: 10, // Padding on the right for arrow
    overflow: 'hidden',
    position: 'relative', // Needed for absolute positioning of hidden picker
    // Shadow/Elevation for depth
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2,
    // Background/Border color applied inline
  },
  pickerSelectedText: {
    flex: 1, // Take available space before the arrow
    fontSize: 16, // Match search bar font size
    // Color applied inline
  },
  pickerArrow: {
    fontSize: 12,
    marginLeft: 5, // Small space before arrow
    // Color applied inline
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0, // Make it invisible
    // Ensure it covers the whole area to be tappable
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent', // Just in case
  },
  pickerItem: {
    // Style for items in the dropdown modal/list
    // fontSize: 16,
    // backgroundColor: colors.card, // Example
    // color: colors.text, // Example
  },
  // --- End UPDATED Picker Styles ---

  listContent: { paddingHorizontal: LIST_PADDING_HORIZONTAL, paddingVertical: 8, },
  infoText: { textAlign: 'center', marginTop: 20, fontSize: 16, paddingHorizontal: 20, opacity: 0.8, },
  inlineLoader: { marginVertical: 20, }, // Loader specifically for filter application
  placeholderItem: { flex: 1, margin: ITEM_MARGIN_HORIZONTAL, height: 0, }, // Placeholder style
});

export default PokemonListScreen;
