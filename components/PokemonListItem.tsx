// components/PokemonListItem.tsx
import React, { useState, useEffect, forwardRef } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLove } from '../context/LoveContext'; // Import the custom hook
import { getPokemonDetailsByUrl } from '../services/pokeApi';
import { capitalizeFirstLetter } from '../utils/helpers';

interface Props {
  name: string;
  url: string;
  [key: string]: any;
}

const PokemonListItem = forwardRef<View, Props>(({ name, url, ...pressableProps }, ref) => {
  const { colors } = useTheme();
  const { lovedNames, toggleLove, isLoadingLove } = useLove(); // Get love state and function
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  // Determine if this specific Pokemon is loved
  const isLoved = lovedNames.has(name);

  useEffect(() => {
    let isMounted = true;
    const fetchSprite = async () => {
      setLoadingImage(true); // Ensure loading state is true when fetching
      try {
        const details = await getPokemonDetailsByUrl(url);
        const sprite = details?.sprites?.other?.['official-artwork']?.front_default
                    || details?.sprites?.front_default;
        if (isMounted && sprite) { setImageUrl(sprite); }
        else if (isMounted) { console.warn(`[PokemonListItem ${name}] Sprite URL is null or undefined.`); }
      } catch (error) { console.error(`[PokemonListItem ${name}] Could not fetch sprite:`, error); }
      finally { if (isMounted) { setLoadingImage(false); } }
    };
    fetchSprite();
    return () => { isMounted = false; };
  }, [url, name]);

  const handleLovePress = (event: any) => {
    // Prevent the main item press (navigation) when clicking the love button
    event.stopPropagation(); // Stop event bubbling up to the parent Pressable
    console.log(`Love button pressed for ${name}`);
    toggleLove(name); // Call the context function
  };

  return (
    // Main Pressable for navigation (receives props from Link asChild)
    <Pressable
        ref={ref}
        {...pressableProps}
        style={({ pressed }) => [
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressedItem
        ]}>

        {/* Love Button */}
        {/* Render only when love state is loaded */}
        {!isLoadingLove && (
            <Pressable
                onPress={handleLovePress}
                style={styles.loveButton}
                hitSlop={10} // Increase tappable area
            >
                <Text style={styles.loveIcon}>{isLoved ? '❤️' : '🤍'}</Text>
                {/* You can replace Text with an Icon component */}
            </Pressable>
        )}

        {/* Existing Content */}
        <View style={styles.imageContainer}>
            {loadingImage ? ( <ActivityIndicator color={colors.primary} size="small" /> )
             : imageUrl ? ( <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" /> )
             : ( <View style={[styles.imagePlaceholder, { backgroundColor: colors.border + '30' }]} /> )
            }
        </View>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {capitalizeFirstLetter(name)}
        </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'space-between',
    position: 'relative', // Needed for absolute positioning of the button
  },
  pressedItem: { opacity: 0.7, },
  imageContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 5, },
  image: { width: '100%', height: '100%', },
  imagePlaceholder: { width: 70, height: 70, borderRadius: 35, },
  name: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 5, },
  // --- Love Button Styles ---
  loveButton: {
    position: 'absolute',
    top: 8, // Adjust position as needed
    right: 8,
    zIndex: 1, // Ensure it's above other content
    padding: 5, // Add padding to make it easier to press
    // Optional background for better visibility/tap area
    // backgroundColor: 'rgba(0,0,0,0.1)',
    // borderRadius: 15,
  },
  loveIcon: {
    fontSize: 22, // Adjust icon size
  },
  // --- End Love Button Styles ---
});

export default PokemonListItem;
