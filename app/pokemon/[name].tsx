// app/pokemon/[name].tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Pressable, Platform } from 'react-native';
import { useLocalSearchParams, Link, Stack, useRouter } from 'expo-router';

// Context and API imports
import { useTheme } from '../../context/ThemeContext';
import { useLove } from '../../context/LoveContext'; // <-- Import useLove
import {
    getPokemonDetailsByName, PokemonDetail,
    getPokemonSpeciesByUrl, PokemonSpecies,
    getEvolutionChainByUrl, EvolutionChain, ChainLink,
} from '../../services/pokeApi';
import { capitalizeFirstLetter } from '../../utils/helpers';

// --- Components and Constants ---
const screenWidth = Dimensions.get('window').width;

// Helper Component for Evolution Item
interface EvolutionItemProps { species: { name: string; url: string }; colors: ReturnType<typeof useTheme>['colors']; }
const EvolutionItem: React.FC<EvolutionItemProps> = ({ species, colors }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(true);
    useEffect(() => {
        let isMounted = true;
        const fetchSprite = async () => {
            try {
                setLoadingImage(true);
                const details = await getPokemonDetailsByName(species.name);
                const sprite = details?.sprites?.other?.['official-artwork']?.front_default || details?.sprites?.front_default;
                if (isMounted && sprite) { setImageUrl(sprite); }
                else if (isMounted) { console.warn(`[EvolutionItem] Sprite not found for ${species.name}`); }
            } catch (e) { console.error(`[EvolutionItem] Failed to fetch sprite for ${species.name}`, e); }
            finally { if (isMounted) setLoadingImage(false); }
        };
        fetchSprite();
        return () => { isMounted = false; };
    }, [species.name]);

    return (
        <Link href={`/pokemon/${species.name}`} asChild>
            <Pressable style={styles.evolutionItem}>
                <View style={[styles.evolutionImageContainer, { backgroundColor: colors.border + '30' }]}>
                    {loadingImage ? <ActivityIndicator size="small" color={colors.primary} />
                     : imageUrl ? <Image source={{ uri: imageUrl }} style={styles.evolutionImage} resizeMode="contain" />
                     : <View style={[styles.evolutionImagePlaceholder, { backgroundColor: colors.border + '15' }]} />
                    }
                </View>
                <Text style={[styles.evolutionName, { color: colors.text }]}>{capitalizeFirstLetter(species.name)}</Text>
            </Pressable>
        </Link>
    );
};
// --- End EvolutionItem ---


// --- Main Detail Screen Component ---
const PokemonDetailScreen = () => {
  const params = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  // Ensure pokemonName is consistently lowercase and defined
  const pokemonName = typeof params.name === 'string' ? params.name.toLowerCase() : undefined;
  const { colors } = useTheme();
  const { lovedNames, toggleLove, isLoadingLove } = useLove(); // <-- Use the love context
  const [details, setDetails] = useState<PokemonDetail | null>(null);
  const [species, setSpecies] = useState<PokemonSpecies | null>(null);
  const [evolution, setEvolution] = useState<EvolutionChain | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if the current Pokemon is loved (only if name is valid and love state is loaded)
  const isLoved = useMemo(() => {
      return !isLoadingLove && pokemonName ? lovedNames.has(pokemonName) : false;
  }, [lovedNames, pokemonName, isLoadingLove]); // Add isLoadingLove dependency

  // Fetch data effect
  useEffect(() => {
    if (!pokemonName) { setError('Pokemon name not provided.'); setLoading(false); return; }
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true); setError(null); setDetails(null); setSpecies(null); setEvolution(null);
        // Fetch Details
        const detailData = await getPokemonDetailsByName(pokemonName);
        if (!isMounted || !detailData) { if(isMounted) throw new Error("Failed to fetch details or component unmounted."); return; }
        setDetails(detailData);

        // Fetch Species
        let speciesData: PokemonSpecies | null = null;
        if (detailData?.species?.url) {
             speciesData = await getPokemonSpeciesByUrl(detailData.species.url);
             if (!isMounted) return;
             setSpecies(speciesData);
        } else { console.warn(`[PokemonDetailScreen Effect] Species URL not found.`); }

        // Fetch Evolution
        if (speciesData?.evolution_chain?.url) {
            const evolutionData = await getEvolutionChainByUrl(speciesData.evolution_chain.url);
            if (!isMounted) return;
            setEvolution(evolutionData);
        } else { console.warn(`[PokemonDetailScreen Effect] Evolution chain URL not found.`); }

      } catch (err: any) {
        if (isMounted) {
            const errorMsg = err.message || `Failed to load data for ${pokemonName}.`;
            setError(errorMsg);
            console.error(`[PokemonDetailScreen Effect] Error:`, err);
        }
      } finally {
        if (isMounted) { setLoading(false); }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [pokemonName]);

  // Memoized derived data
  const flavorText = useMemo(() => { if (!species) return '...'; const entry = species.flavor_text_entries?.findLast(e => e.language.name === 'en'); return entry?.flavor_text?.replace(/[\n\f\s]+/g, ' ').trim() ?? 'No description available.'; }, [species]);
  const genus = useMemo(() => { if (!species) return ''; return species.genera?.find(g => g.language.name === 'en')?.genus ?? ''; }, [species]);

  // Recursive Evolution Rendering
  const renderEvolutionChain = (chainLink: ChainLink | undefined): JSX.Element[] => {
    if (!chainLink?.species) return [];
    const elements: JSX.Element[] = [<EvolutionItem key={chainLink.species.name} species={chainLink.species} colors={colors} />];
    if (chainLink.evolves_to && chainLink.evolves_to.length > 0) {
      elements.push(<Text key={`${chainLink.species.name}-arrow`} style={[styles.evolutionArrow, { color: colors.text }]}>➔</Text>);
      if (chainLink.evolves_to.length === 1) {
        elements.push(...renderEvolutionChain(chainLink.evolves_to[0]));
      } else {
        // Handle multiple branches (e.g., Eevee)
        const branches = chainLink.evolves_to.map((branch, index) => (
            <View key={`${branch.species.name}-${index}`} style={styles.evolutionBranch}>
                {renderEvolutionChain(branch)}
            </View>
        ));
        elements.push(<View key={`${chainLink.species.name}-branches`} style={styles.evolutionBranchesContainer}>{branches}</View>);
      }
    }
    return elements;
  };

  // Back navigation
  const handleGoBack = () => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } };

  // --- Love Toggle Handler ---
  const handleLoveToggle = () => {
    if (pokemonName) { // Ensure name is valid before toggling
      console.log(`Toggling love for ${pokemonName}`);
      toggleLove(pokemonName);
    } else {
      console.warn("[PokemonDetailScreen] Attempted to toggle love for undefined Pokemon name.");
    }
  };
  // --- End Love Toggle Handler ---

  // Loading / Error State Rendering
  if (loading) { return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>; }
  if (error) { return <View style={styles.centered}><Text style={[styles.errorText, { color: colors.error || 'red' }]}>{error}</Text></View>; }
  if (!details?.name) { return <View style={styles.centered}><Text style={[styles.errorText, { color: colors.text }]}>Could not load Pokémon details.</Text></View>; }

  // Main Content Rendering
  const sprite = details.sprites?.other?.['official-artwork']?.front_default || details.sprites?.front_default || details.sprites?.other?.home?.front_default || null;

  return (
    <>
      {/* Set the header title dynamically */}
      <Stack.Screen options={{ title: capitalizeFirstLetter(details.name) }} />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>

        {/* Back Button */}
        {/* <Pressable onPress={handleGoBack} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border + '80' }]}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>&lt; Back</Text>
        </Pressable> */}

        {/* --- Header Section --- */}
        <View style={styles.header}>
            {/* Existing Header Content */}
            {sprite ? <Image source={{ uri: sprite }} style={styles.image} resizeMode="contain" /> : <View style={[styles.imagePlaceholder, {backgroundColor: colors.border+'30'}]}><Text style={{color: colors.text, fontSize: 18}}>?</Text></View>}
            <Text style={[styles.name, { color: colors.text }]}>{capitalizeFirstLetter(details.name)} #{details.id?.toString().padStart(4, '0') ?? '????'}</Text>
            <Text style={[styles.genus, { color: colors.text }]}>{genus}</Text>
            <View style={styles.typesContainer}>{details.types?.map(({ type }) => (<View key={type.name} style={[styles.typeBadge, { backgroundColor: getTypeColor(type.name) }]}><Text style={styles.typeText}>{capitalizeFirstLetter(type.name)}</Text></View>))}</View>
        </View>
        {/* --- End Header Section --- */}


        {/* --- Love Button Section --- */}
        <View style={styles.loveButtonContainer}>
            {/* Render only when love state is loaded and name is valid */}
            {!isLoadingLove && pokemonName && (
                <Pressable
                    onPress={handleLoveToggle}
                    style={styles.detailLoveButton} // Use updated style
                    hitSlop={15} // Generous hit area
                >
                    <Text style={styles.detailLoveIcon}>{isLoved ? '❤️' : '🤍'}</Text>
                </Pressable>
            )}
        </View>
        {/* --- End Love Button Section --- */}


        {/* Description Section */}
        {species && (
            <View style={[styles.section, styles.firstSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pokédex Entry</Text>
                <Text style={[styles.description, { color: colors.text }]}>{flavorText}</Text>
            </View>
        )}
        {/* Base Stats Section */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Base Stats</Text>
            {details.stats?.map(({ stat, base_stat }) => (
                <View key={stat.name} style={styles.statRow}>
                    <Text style={[styles.statName, { color: colors.text }]}>{capitalizeFirstLetter(stat.name.replace(/-/g, ' '))}</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{base_stat}</Text>
                    <View style={[styles.statBarBackground, {backgroundColor: colors.border+'50'}]}>
                        <View style={[styles.statBarFill, { width: `${Math.min(100, (base_stat / 255) * 100)}%`, backgroundColor: getStatColor(base_stat) }]} />
                    </View>
                </View>
            ))}
        </View>
        {/* Abilities Section */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Abilities</Text>
            {details.abilities?.map(({ ability, is_hidden }) => (
                <Text key={ability.name} style={[styles.abilityText, { color: colors.text }]}>
                    {capitalizeFirstLetter(ability.name.replace(/-/g, ' '))} {is_hidden ? <Text style={styles.hiddenText}>(Hidden)</Text> : ''}
                </Text>
            ))}
        </View>
        {/* Details Section */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
            <View style={styles.detailsGrid}>
                {details.height !== undefined && <Text style={[styles.detailText, { color: colors.text }]}>Height: {details.height / 10} m</Text>}
                {details.weight !== undefined && <Text style={[styles.detailText, { color: colors.text }]}>Weight: {details.weight / 10} kg</Text>}
                {species?.color?.name && <Text style={[styles.detailText, { color: colors.text }]}>Color: {capitalizeFirstLetter(species.color.name)}</Text>}
                {species?.habitat?.name && <Text style={[styles.detailText, { color: colors.text }]}>Habitat: {capitalizeFirstLetter(species.habitat.name)}</Text>}
                {species?.shape?.name && <Text style={[styles.detailText, { color: colors.text }]}>Shape: {capitalizeFirstLetter(species.shape.name)}</Text>}
                {species?.capture_rate !== undefined && <Text style={[styles.detailText, { color: colors.text }]}>Capture Rate: {species.capture_rate}</Text>}
                {species?.base_happiness !== undefined && <Text style={[styles.detailText, { color: colors.text }]}>Base Happiness: {species.base_happiness}</Text>}
                {species?.growth_rate?.name && <Text style={[styles.detailText, { color: colors.text }]}>Growth Rate: {capitalizeFirstLetter(species.growth_rate.name.replace(/-/g, ' '))}</Text>}
            </View>
        </View>
        {/* Evolution Chain Section */}
        {evolution?.chain?.species && (
            <View style={[styles.section, { borderTopColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Evolution Chain</Text>
                <View style={styles.evolutionContainer}>
                    {renderEvolutionChain(evolution.chain)}
                </View>
            </View>
        )}
      </ScrollView>
    </>
  );
};

// --- Helper Functions & Styles ---
const typeColors: Record<string, string> = { normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C', grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A', rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD', };
const getTypeColor = (type: string): string => { return typeColors[type.toLowerCase()] || '#777'; };
const getStatColor = (value: number): string => { if (value < 60) return '#EF5350'; if (value < 90) return '#FFCA28'; if (value < 120) return '#66BB6A'; return '#42A5F5'; };

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { textAlign: 'center', fontSize: 16, lineHeight: 22, fontWeight: '500' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40, paddingTop: 60 }, // Keep padding for back button
  backButton: { position: 'absolute', top: Platform.OS === 'ios' ? 15 : 10, left: 15, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, zIndex: 10, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3, },
  backButtonText: { fontSize: 14, fontWeight: '600', },
  header: {
      alignItems: 'center',
      paddingVertical: 0,
      paddingHorizontal: 15,
      marginTop: 10,
      // No position relative needed here anymore
  },
  image: { width: screenWidth * 0.55, height: screenWidth * 0.55, marginBottom: 10 },
  imagePlaceholder: { width: screenWidth * 0.55, height: screenWidth * 0.55, marginBottom: 10, borderRadius: (screenWidth * 0.275), justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 28, fontWeight: 'bold', textTransform: 'capitalize', textAlign: 'center', marginBottom: 5 },
  genus: { fontSize: 18, fontStyle: 'italic', marginBottom: 15, opacity: 0.8 },
  typesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  typeBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, margin: 4, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, }, android: { elevation: 3, }, web: { boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.2)', } }) },
  typeText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },
  section: { marginHorizontal: 15, marginTop: 20, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth },
  firstSection: { // Style for the first section after the love button
    marginTop: 0, // Remove default top margin
    paddingTop: 15, // Adjust padding if needed
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statName: { width: 110, fontSize: 14, textTransform: 'capitalize' },
  statValue: { width: 40, fontSize: 14, fontWeight: 'bold', textAlign: 'right', marginRight: 10 },
  statBarBackground: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 4 },
  abilityText: { fontSize: 15, marginBottom: 6, textTransform: 'capitalize', lineHeight: 20 },
  hiddenText: { fontStyle: 'italic', opacity: 0.8, fontSize: 13 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailText: { fontSize: 15, marginBottom: 8, width: '48%', lineHeight: 20 },
  evolutionContainer: { alignItems: 'center', marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 5 },
  evolutionItem: { alignItems: 'center', marginVertical: 5, marginHorizontal: 8, width: 90 },
  evolutionImageContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 4, overflow: 'hidden' },
  evolutionImage: { width: '100%', height: '100%' },
  evolutionImagePlaceholder: { width: 60, height: 60, borderRadius: 30 },
  evolutionName: { fontSize: 14, fontWeight: 'bold', marginTop: 3, textAlign: 'center', flexWrap: 'wrap' },
  evolutionArrow: { fontSize: 24, marginHorizontal: 5, fontWeight: '300', alignSelf: 'center' },
  evolutionBranchesContainer: { flexDirection: 'column', alignItems: 'center', marginLeft: 10 },
  evolutionBranch: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },

  // --- Styles for Centered Love Button ---
  loveButtonContainer: {
    alignItems: 'center', // Center the button horizontally
    marginVertical: 15, // Add space above and below the button
  },
  detailLoveButton: {
    // No absolute positioning needed
    padding: 10, // Keep padding for tappable area
    // Optional: Add background/border if you want it visually distinct
    // backgroundColor: colors.card,
    // borderRadius: 50, // Make it a circle
    // borderWidth: 1,
    // borderColor: colors.border,
  },
  detailLoveIcon: {
    fontSize: 32, // Keep icon size large
    // Shadow might still be useful
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // --- End Love Button Styles ---
});

export default PokemonDetailScreen;