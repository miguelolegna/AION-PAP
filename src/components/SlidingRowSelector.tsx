import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { AddChargerStyles as styles } from '../styles/Screens/AddChargerStyles';

const { width } = Dimensions.get("window");
const SELECTOR_WIDTH = width - 40;

const SlidingRowSelector = ({ options, current, onSelect }: any) => {
  const innerWidth = SELECTOR_WIDTH - 8;
  const itemWidth = innerWidth / options.length;
  const index = options.findIndex((o: any) => o.value === current);
  
  const transX = useRef(new Animated.Value(index !== -1 ? index * itemWidth : 0)).current;

  useEffect(() => {
    if (index !== -1) {
      Animated.timing(transX, {
        toValue: index * itemWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [current, index]);

  return (
    <View style={styles.slidingContainer}>
      <Animated.View style={[styles.sliderActiveBg, { width: itemWidth, transform: [{ translateX: transX }] }]} />
      {options.map((opt: any) => (
        <TouchableOpacity 
          key={opt.value} 
          style={styles.slidingOption} 
          onPress={() => onSelect(opt.value)}
          activeOpacity={1}
        >
          <Text style={[styles.optionText, current === opt.value && styles.optionTextSelected]}>
            {opt.label || opt.value}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default SlidingRowSelector;