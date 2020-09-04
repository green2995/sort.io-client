import React, { RefObject } from 'react'
import { View, Text } from 'react-native'
import Block from './Block';
import NativeRefBox from './NativeRefBox';
import TopBase from './Block/TopBase';
import SpikyTop from './Block/Spiky/SpikyTop';
import PieceBase from './Block/PieceBase';
import SpikyPiece from './Block/Spiky/SpikyPiece';
import BottomBase from './Block/BottomBase';
import SpikyBottom from './Block/Spiky/SpikyBottom';
import { NotoSans } from './Generic/StyledComponents';
import StrokedText from './StrokedText';
import chroma from 'chroma-js';

type LoadingProps = {
  checkIfLoaded: () => boolean;
  onAnimationCompleted?: () => any;
  onLastAnimationStarted?: () => any;
}

const Loading = (props: LoadingProps) => {
  const { checkIfLoaded, onAnimationCompleted, onLastAnimationStarted } = props;
  const topRef = React.createRef<Block>();
  const pieceRef = React.createRef<Block>();
  const bottomRef = React.createRef<Block>();
  const refBoxTopRef = React.createRef<NativeRefBox>();
  const refBoxPieceRef = React.createRef<NativeRefBox>();
  const refBoxBottomRef = React.createRef<NativeRefBox>();
  const refBoxBlockRef = React.createRef<NativeRefBox>();
  const exclaimerRef = React.createRef<NativeRefBox>();

  const scaleOnComplete = 1.5;

  const setBlockType = (blockRef: RefObject<Block>, type: number) => {
    blockRef.current?.setState({
      type: type,
    })
  }

  const setPieceColorRandom = () => {
    const getRandomTypeOtherThan1 = () => {
      return 10 + Math.ceil(Math.random() * 10);
    }
    setBlockType(pieceRef, getRandomTypeOtherThan1())
  }

  const dockCap = () => {
    refBoxTopRef.current?.setOpacity(1);
    refBoxTopRef.current?.animate({
      style: {
        top: 0,
      },
      duration: 500,
      easing: "easeOutBounce",
      fps: 60,
    }).start();
  }

  const undockPiece = (onComplete?: () => void) => {
    refBoxPieceRef.current?.animate({
      style: {
        top: -20,
      },
      duration: 200,
      easing: "easeInOutSine",
      fps: 60
    }).start(() => {
      refBoxPieceRef.current?.animate({
        style: {
          opacity: 0,
        },
        duration: 200,
        easing: "easeInOutSine",
        fps: 60,
      }).start(onComplete);
    });
  }

  const dockPiece = (onComplete?: () => void) => {
    refBoxPieceRef.current?.animate({
      style: {
        opacity: 1,
      },
      duration: 500,
      easing: "easeInOutSine",
      fps: 60,
    }).start(() => {
      refBoxPieceRef.current?.animate({
        style: {
          top: 0,
        },
        duration: 300,
        easing: "easeOutBounce",
        fps: 60,
      }).start(onComplete);
    });
  }

  const popExclaimer = () => {
    exclaimerRef.current?.animate({
      style: {
        top: 0,
        opacity: 1,
      },
      duration: 800,
      easing: "easeOutElastic",
    }).start();
  }
  
  const scaleUpBlock = (callback?: () => any) => {
    refBoxBlockRef.current?.animate({
      style: {
        scaleX: scaleOnComplete,
        scaleY: scaleOnComplete,
        translateY: -30,
      },
      duration: 500,
      easing: "easeOutElastic",
    }).start(() => {
      if (callback) {
        callback();
      }
    });
  }

  const changePiece = (callback?: () => any) => {
    const isLoaded = checkIfLoaded();
    if (!isLoaded) {
      undockPiece(() => {
        setPieceColorRandom();
        dockPiece(callback)
      });
    } else {
      undockPiece(() => {
        setBlockType(pieceRef, 1);
        dockPiece(() => {
          if (onLastAnimationStarted) {
            onLastAnimationStarted();
          }
          dockCap();
          popExclaimer();
          scaleUpBlock(() => {
            if (onAnimationCompleted) {
              onAnimationCompleted();
            }
          })          
        });
      });
    }
  }

  let neverStopChange = () =>
    changePiece(() => {
      changePiece(neverStopChange)
    })

  React.useEffect(() => {
    exclaimerRef.current?.setStyle({
      alignItems: 'center', top: 50, opacity: 0
    })

    refBoxBlockRef.current?.setStyle({
      scaleX: 1,
      scaleY: 1,
      translateY: 0,
    })

    setBlockType(topRef, 10);

    refBoxTopRef.current?.setStyle({
      opacity: 0,
      top: -20
    })

    neverStopChange();

    return () => {
      neverStopChange = () => {}
    }
  })

  return (
    <NativeRefBox ref={refBoxBlockRef}>
      <NativeRefBox ref={exclaimerRef}>
        <StrokedText
          text="!"
          dyMultiplier={0.36}
          fillColor={
            chroma("yellowgreen")
              .set("hsl.l", 0.5)
              .set("hsl.s", 1)
              .hex()
          }
          fontFamily="NotoSansKR-Black"
          height={40}
          fontSize={30}
          strokeColor="black"
          strokeWidth={5}
          width={20}
        />
      </NativeRefBox>
      <NativeRefBox ref={refBoxTopRef} style={{ opacity: 0 }}>
        <Block
          ref={topRef}
          base={TopBase}
          shape={SpikyTop}
          scale={1}
          type={1}
        />
      </NativeRefBox>
      <NativeRefBox ref={refBoxPieceRef}>
        <Block
          ref={pieceRef}
          base={PieceBase}
          shape={SpikyPiece}
          scale={1}
          type={1}
        />
      </NativeRefBox>
      <NativeRefBox ref={refBoxBottomRef}>
        <Block
          ref={bottomRef}
          base={BottomBase}
          shape={SpikyBottom}
          scale={1}
          type={1}
        />
      </NativeRefBox>
    </NativeRefBox>
  )
}

export default Loading