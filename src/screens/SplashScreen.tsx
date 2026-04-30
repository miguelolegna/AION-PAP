import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';

// IMPORTS DE VÍDEO COMENTADOS
// import { useVideoPlayer, VideoView } from 'expo-video'; 
// import { useEvent } from 'expo';

interface SmartSplashScreenProps {
  isLoading: boolean;
  onPrepareExit: () => void;
  onFinish: () => void;
}

const SmartSplashScreen: React.FC<SmartSplashScreenProps> = ({ isLoading, onPrepareExit, onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isVisible, setIsVisible] = useState(true);
  const exitTriggered = useRef(false);

  // --- DECLARAÇÕES DO VÍDEO COMENTADAS ---
  /*
  const player = useVideoPlayer(require('../../assets/Animação_com_Ficha_na_Ponta.mp4'), (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  useEvent(player, 'playingChange');
  useEvent(player, 'statusChange');
  */

  // TEMPORIZADOR SINTÉTICO (Substitui a dependência da duração do vídeo)
  const [isSimulatedVideoEnd, setIsSimulatedVideoEnd] = useState(false);

  useEffect(() => {
    const fakeVideoDuration = setTimeout(() => {
      setIsSimulatedVideoEnd(true);
    }, 3500); // 3.5 segundos de tempo mínimo de ecrã garantido
    return () => clearTimeout(fakeVideoDuration);
  }, []);

  useEffect(() => {
    const checkStatus = () => {
      if (exitTriggered.current) return;

      // --- LÓGICA DO VÍDEO COMENTADA ---
      /*
      if (!isLoading && player.playing) {
        player.playbackRate = 2.5;
      }
      const isVideoAtEnd = player.duration > 0 && player.currentTime >= (player.duration - 0.2);
      const isIdle = player.status === 'idle';
      */

      // NOVA CONDIÇÃO DE SAÍDA: Loading concluído + Temporizador de Segurança concluído
      if (!isLoading && isSimulatedVideoEnd) {
        exitTriggered.current = true;
        
        onPrepareExit(); 

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }).start(() => {
          setIsVisible(false);
          onFinish();
        });
      }
    };

    const frame = requestAnimationFrame(checkStatus);
    return () => cancelAnimationFrame(frame);
  }, [isLoading, isSimulatedVideoEnd]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* 
      <VideoView
        player={player}
        style={styles.videoView}
        contentFit="contain"
        nativeControls={false}
      /> 
      */}

      {/* INJEÇÃO DA IMAGEM ESTÁTICA COM EXTENSÃO CORRIGIDA */}
      <Image 
        source={require('../../assets/logos/full_logo_better.jpeg')} 
        style={styles.imageView}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
    justifyContent: 'center', // Adicionado para centrar a imagem
    alignItems: 'center',     // Adicionado para centrar a imagem
  },
  videoView: {
    width: '100%',
    height: '100%',
  },
  imageView: {
    width: '70%',  // Evita que o logo toque nas margens
    height: '70%',
  }
});

export default SmartSplashScreen;