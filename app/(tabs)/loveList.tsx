// app/(tabs)/loveList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  Dimensions, TextInput, Pressable, Platform
} from 'react-native';
import { Link } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../context/ThemeContext';
import { useLove } from '../../context/LoveContext';
import PokemonListItem from '../../components/PokemonListItem';
import {
    NamedAPIResource,
    getAllTypes,
    getAllRegions,
    getTypeDetailsByName,
    getPokemonByRegionName
} from '../../services/pokeApi';
import { capitalizeFirstLetter } from '../../utils/helpers';

// --- Constants and Calculation Functions (remain the same) ---
const ITEM_MARGIN_HORIZONTAL = 5;
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


const LoveListScreen = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const { lovedNames, isLoadingLove } = useLove();

  // --- State (remains the same) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<NamedAPIResource[]>([]);
  const [availableRegions, setAvailableRegions] = useState<NamedAPIResource[]>([]);
  const [loadingFiltersOptions, setLoadingFiltersOptions] = useState(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [displayList, setDisplayList] = useState<NamedAPIResource[]>([]);
  const [filterError, setFilterError] = useState<string | null>(null);
  // --- End State ---

  // --- Effects (remain the same) ---
  useEffect(() => { /* Update Screen Width */
    const updateLayout = (dims: { window: { width: number; height: number } }) => setScreenWidth(dims.window.width);
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);
  useEffect(() => { /* Fetch Filter Options */
    let isMounted = true;
    const fetchFilterOptions = async () => { setLoadingFiltersOptions(true); try { const [typeList, regionList] = await Promise.all([getAllTypes(), getAllRegions()]); if (isMounted) { setAvailableTypes(typeList); setAvailableRegions(regionList); } } catch (error) { if (isMounted) setFilterError("Failed to load filter options."); } finally { if (isMounted) setLoadingFiltersOptions(false); } };
    fetchFilterOptions(); return () => { isMounted = false; };
  }, []);
  const numColumns = useMemo(() => calculateNumColumns(screenWidth), [screenWidth]);
  useEffect(() => { /* Apply Filters */
    if (isLoadingLove || loadingFiltersOptions) { setDisplayList([]); return; } let isMounted = true; const applyAllFilters = async () => { setIsApplyingFilters(true); setFilterError(null); try { let finalFilteredNames = new Set(lovedNames); if (selectedRegion) { const regionPokemonList = await getPokemonByRegionName(selectedRegion); const regionPokemonSet = new Set(regionPokemonList.map(p => p.name)); finalFilteredNames = new Set([...finalFilteredNames].filter(name => regionPokemonSet.has(name))); } if (selectedType) { const typeDetails = await getTypeDetailsByName(selectedType); const typePokemonList = typeDetails?.pokemon?.map(p => p.pokemon) ?? []; const typePokemonSet = new Set(typePokemonList.map(p => p.name)); finalFilteredNames = new Set([...finalFilteredNames].filter(name => typePokemonSet.has(name))); } let searchFilteredNames = finalFilteredNames; if (searchTerm) { const lowerSearchTerm = searchTerm.toLowerCase(); searchFilteredNames = new Set([...finalFilteredNames].filter(name => name.toLowerCase().includes(lowerSearchTerm))); } const finalData = Array.from(searchFilteredNames).sort().map(name => ({ name: name, url: `https://pokeapi.co/api/v2/pokemon/${name}` })); if (isMounted) setDisplayList(finalData); } catch (err: any) { if (isMounted) { setFilterError(err.message || 'Failed to apply filters.'); setDisplayList([]); } } finally { if (isMounted) setIsApplyingFilters(false); } };
    applyAllFilters(); return () => { isMounted = false; };
  }, [searchTerm, selectedType, selectedRegion, lovedNames, isLoadingLove, loadingFiltersOptions]);
  // --- End Effects ---


  // --- Prepare Data with Placeholders (remains the same) ---
  const listDataWithPlaceholders = useMemo((): ListItemData[] => {
    const currentData = displayList; if (!currentData || currentData.length === 0) return []; const remainder = currentData.length % numColumns; const placeholdersNeeded = remainder === 0 ? 0 : numColumns - remainder; const placeholders: ListItemData[] = Array.from({ length: placeholdersNeeded }, (_, i) => ({ name: `placeholder_${currentData.length + i}`, isPlaceholder: true })); return [...currentData, ...placeholders];
  }, [displayList, numColumns]);
  // --- End Data Preparation ---


  // --- Render List Item & Key Extractor (remain the same) ---
  const renderItem = ({ item }: { item: ListItemData }) => { if ('isPlaceholder' in item && item.isPlaceholder) { return <View style={styles.placeholderItem} />; } const pokemonItem = item as NamedAPIResource; if (!pokemonItem?.name || !pokemonItem?.url) return null; return ( <Link href={`/pokemon/${pokemonItem.name}`} asChild><PokemonListItem name={pokemonItem.name} url={pokemonItem.url} /></Link> ); };
  const keyExtractor = (item: ListItemData) => item.name;
  // --- End Render List Item & Key Extractor ---


  // --- Loading State (remains the same) ---
  const isOverallLoading = isLoadingLove || loadingFiltersOptions;
  if (isOverallLoading) { return ( <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.infoText, { color: colors.text }]}>Loading Favorites...</Text></View> ); }
  // --- End Loading State ---


  // --- Determine Empty/Error State Content (remains the same) ---
  const noLovedItemsInitially = lovedNames.size === 0;
  const noResultsAfterFiltering = displayList.length === 0 && !noLovedItemsInitially;
  // --- End Empty/Error State ---


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* --- Search and Filter Area --- */}
      <View style={[styles.controlsContainer, { borderBottomColor: colors.border }]}>
        {/* Search Row (remains the same) */}
        <View style={styles.searchRow}>
            <TextInput style={[ styles.searchBar, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2, } ]} placeholder="Search Favorites..." placeholderTextColor={colors.text + '80'} value={searchTerm} onChangeText={setSearchTerm} />
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
                    dropdownIconColor={colors.text} // Still useful on Android
                    mode="dropdown"
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
                    dropdownIconColor={colors.text} // Still useful on Android
                    mode="dropdown"
                >
                    <Picker.Item label="All Regions" value="all" style={styles.pickerItem} />
                    {availableRegions.map(region => ( <Picker.Item key={region.name} label={capitalizeFirstLetter(region.name)} value={region.name} style={styles.pickerItem} /> ))}
                </Picker>
            </View>
        </View>
        {/* --- END MODIFIED Filter Pickers Row --- */}
      </View>
      {/* --- End Search and Filter Area --- */}


      {/* --- Loading / Error / List / Empty States (remain the same) --- */}
      {isApplyingFilters ? ( <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View> )
      : filterError ? ( <View style={styles.centered}><Text style={[styles.infoText, { color: colors.error || 'red' }]}>{filterError}</Text></View> )
      : noLovedItemsInitially ? ( <View style={styles.centered}><Text style={[styles.infoText, { color: colors.text }]}>You haven't loved any Pokémon yet!</Text><Text style={[styles.infoTextSubtle, { color: colors.text + 'aa' }]}>Tap the heart icon on a Pokémon in the main list.</Text></View> )
      : noResultsAfterFiltering ? ( <View style={styles.centered}><Text style={[styles.infoText, { color: colors.text }]}>No loved Pokémon found matching the criteria.</Text></View> )
      : ( <FlatList key={numColumns} data={listDataWithPlaceholders} renderItem={renderItem} keyExtractor={keyExtractor} contentContainerStyle={styles.listContent} numColumns={numColumns} initialNumToRender={numColumns * 5} maxToRenderPerBatch={numColumns * 3} windowSize={11} removeClippedSubviews={true} /> )}
      {/* --- End Loading / Error / List / Empty States --- */}
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
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
  infoText: { textAlign: 'center', fontSize: 18, fontWeight: '500', marginBottom: 8, },
  infoTextSubtle: { textAlign: 'center', fontSize: 14, opacity: 0.8, },
  placeholderItem: { flex: 1, margin: ITEM_MARGIN_HORIZONTAL, height: 0, },
});

export default LoveListScreen;
