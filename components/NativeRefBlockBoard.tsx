import React, {Component, RefObject, Fragment} from 'react';
import {
  Text,
  View,
  ViewStyle,
  LayoutRectangle,
  LayoutChangeEvent,
  Easing,
  Animated,
} from 'react-native';
import styled from 'styled-components';
import Constants from '../assets/Constants';
import BlockFrame from './BlockStack/BlockFrame';
import Block from './Block';
import BottomBase from './Block/BottomBase';
import skinMap, {skins} from './BlockStack/skinMap';
import {BlockTypes} from './Block/Types';
import NativeRefBox from './NativeRefBox';
import PieceBase from './Block/PieceBase';
import TouchAgent from './TouchAgent';
import TopBase from './Block/TopBase';

const LayoutContainer: typeof View | React.ComponentClass<{marginLeft: number; marginTop: number}> = styled(View)`
  position: absolute;
  margin-left: ${(props) => props.marginLeft}px;
  margin-top: ${(props) => props.marginTop}px;
`;

const AbsoluteRefBox: typeof NativeRefBox = styled(NativeRefBox)`
  position: absolute;
`;

const Row: typeof View = styled(View)`
  flex-direction: row;
`;

const Cell: typeof View | React.ComponentClass<{scale?: number}, any> = styled(View)<{scale?: number}>`
  width: ${(props) => props.scale ? Constants.blockWidth * props.scale : Constants.blockWidth}px;
  height: ${(props) => props.scale ? Constants.blockHeight.full * props.scale : Constants.blockHeight.full}px;
  justify-content: flex-end;
`;

type pieceModel = {
  ref: RefObject<NativeRefBox>;
  type: BlockTypes;
};

type stackModel = {
  capRef: RefObject<NativeRefBox>;
  capBlockRef: RefObject<Block>;
  pieces: pieceModel[];
  bottomRef: RefObject<Block>;
  max: number;
};

type RefBlockBoardProps = {
  style?: ViewStyle;
  initialMap: BlockTypes[][];
  scale?: number;
  skin: skins;
  onComplete?: () => void;
  onChange?: (score: number) => void;
  onLayout?: (layout: LayoutChangeEvent) => void;
};

type RefBlockBoardState = {
  layout: null | LayoutRectangle;
};

export class RefBlockBoard extends Component<
  RefBlockBoardProps,
  RefBlockBoardState
> {
  constructor(props: RefBlockBoardProps) {
    super(props);
    this.stacks = Array(props.initialMap.length);
    this.state = {
      layout: null,
    };
    this.catchLayout = this.catchLayout.bind(this);

    this.getTopPiecePos = this.getTopPiecePos.bind(this);

    this.undock = this.undock.bind(this);

    this.alertUnableToDock = this.alertUnableToDock.bind(this);
    this.dock = this.dock.bind(this);
    this.dockToSelf = this.dockToSelf.bind(this);
    this.dockToOther = this.dockToOther.bind(this);

    this.checkIfStackCompleted = this.checkIfStackCompleted.bind(this);

    this.getCurScore = this.getCurScore.bind(this);
    this.getCompleteMap = this.getCompleteMap.bind(this);
  }

  stacks: stackModel[];
  layoutRef = React.createRef<View>();
  readyToDock = false;
  dockOrigin: stackModel | null = null;
  isAnimating = false;
  dockCount = 0;
  forceFinishCallbacks: {[index: string]: {
    execute: Function;
    delete: Function;
    executeNDelete: Function;
  }} = {};

  scale = 1;
  maxRows = 3;
  maxColumns = 3;
  blockWidth = Constants.blockWidth;
  blockHeight = Constants.blockHeight.full;
  marginVertical = 15;
  marginHorizontal = 15;

  checkIfStackCompleted(targetStack: stackModel) {
    // const targetStack = this.stacks[stackIndex];
    let stackCompleted = targetStack.pieces.length === targetStack.max;
    targetStack.pieces.forEach((piece) => {
      if (piece.type !== targetStack.pieces[0].type) {
        stackCompleted = false;
      }
    });
    return stackCompleted;
  }

  getCompleteMap() {
    const filledStacks = this.stacks.filter((stack) => stack.pieces.length);
    const completeMap = filledStacks.map((stack) =>
      this.checkIfStackCompleted(stack),
    );
    return completeMap;
  }

  getCurScore() {
    return this.getCompleteMap().filter((bool) => bool).length;
  }

  getTopPiecePos(stackIndex: number) {
    const {
      maxColumns,
      stacks,
      scale,
      marginHorizontal,
      marginVertical,
      blockWidth,
      blockHeight,
    } = this;
    const targetStack = stacks[stackIndex];
    const stackRow = Math.floor(stackIndex / maxColumns);
    const stackColumn = stackIndex % maxColumns;
    const curStackLength = targetStack.pieces.length;

    const curPos = {
      x: marginHorizontal + (blockWidth + marginHorizontal * 2) * stackColumn,
      y:
        marginVertical +
        (blockHeight + marginVertical * 2) * stackRow +
        Constants.blockHeight.top * scale +
        Constants.blockHeight.piece * scale * Constants.maxStackLength -
        Constants.blockHeight.piece * scale * curStackLength,
    };

    return curPos;
  }

  undock(stackIndex: number) {
    const topPiecePos = this.getTopPiecePos(stackIndex);
    const targetStack = this.stacks[stackIndex];
    const pieceOnTop = targetStack.pieces.pop();

    if (!pieceOnTop || !pieceOnTop.ref.current) {
      return;
    }

    
    targetStack.pieces.push(pieceOnTop);
    let originStackWasCompleted = this.checkIfStackCompleted(targetStack);

    if (originStackWasCompleted && targetStack.capRef.current) {
      targetStack.capRef.current.setStyle({
        top: topPiecePos.y - Constants.blockHeight.top * this.scale
      })
      targetStack.capRef.current?.animate({
        style: {
          scaleX: 0,
          scaleY: 0,
          top: topPiecePos.y - 20 - Constants.blockHeight.top * this.scale,
        },
        duration: 100,
        easing: "easeInOutSine",
      }).start();
    }

    this.dockOrigin = targetStack;
    this.readyToDock = true;
    pieceOnTop.ref.current.setStyle({
      opacity: 1,
      top: topPiecePos.y,
    })
    const pieceUndockAnim = pieceOnTop.ref.current?.animate({
      style: {
        top: topPiecePos.y - 20 * this.scale,
      },
      duration: 300,
      easing: "easeOutBack",
    })

    pieceUndockAnim.start();
  }

  dockToSelf(stackIndex: number) {
    const {stacks, getTopPiecePos} = this;
    const targetStack = stacks[stackIndex];
    const topPiecePos = getTopPiecePos(stackIndex);
    const pieceOnTop = targetStack.pieces.pop();

    if (!pieceOnTop || !pieceOnTop.ref.current) {
      return;
    }
    targetStack.pieces.push(pieceOnTop);

    let originStackWasCompleted = this.checkIfStackCompleted(targetStack);

    let animateCapY, animateCapScale;
    if (originStackWasCompleted && targetStack.capRef.current) {
      animateCapY = targetStack.capRef.current.animate({
        style: {
          top: topPiecePos.y - Constants.blockHeight.top * this.scale,
        },
        duration: 300,
        easing: "easeOutBounce",
      })
      animateCapScale = targetStack.capRef.current.animate({
        style: {
          scaleX: 1,
          scaleY: 1,
        },
        duration: 300,
        easing: "easeInOutSine",
      });
    }

    this.readyToDock = false;
    this.dockOrigin = null;
    const pieceDockAnim = pieceOnTop.ref.current?.animate({
      style: {
        top: topPiecePos.y,
      },
      duration: 300,
      easing: "easeOutBounce"
    })

    if (animateCapY && animateCapScale) {
      animateCapY.start();
      animateCapScale.start();
    }

    pieceDockAnim.start();
  }

  alertUnableToDock(stackIndex: number) {
    const {stacks, getTopPiecePos} = this;
    const topPiecePos = getTopPiecePos(stackIndex);
    const targetStack = stacks[stackIndex];
    const pieceOnTop = targetStack.pieces.pop();
    if (!pieceOnTop) {
      return;
    }
    targetStack.pieces.push(pieceOnTop);
    const targetStackCompleted = this.checkIfStackCompleted(targetStack);
    let animateCapScale;
    if (targetStackCompleted) {
      targetStack.capRef.current?.setY(
        topPiecePos.y - Constants.blockHeight.piece * this.scale - Constants.blockHeight.top * this.scale,
      );
      animateCapScale = targetStack.capRef.current?.animate({
        style: {
          top: topPiecePos.y - Constants.blockHeight.top * this.scale,
        },
        duration: 500,
        easing: "easeOutBounce"
      });
      animateCapScale?.start();
    }
    pieceOnTop.ref.current?.setY(topPiecePos.y - Constants.blockHeight.piece * this.scale);
    pieceOnTop.ref.current?.animate({
      style: {
        top: topPiecePos.y
      },
      duration: 300,
      easing: "easeOutBounce"
    }).start();
    return;
  }

  dockToOther(stackIndex: number) {
    const {stacks, getTopPiecePos, dockOrigin, props, dockCount} = this;
    const targetStack = stacks[stackIndex];
    const topPiecePos = getTopPiecePos(stackIndex);
    const pieceOnTopOfOrigin = dockOrigin?.pieces.pop();
    const targetStackWasBlank = targetStack.pieces.length === 0;

    if (!pieceOnTopOfOrigin || !pieceOnTopOfOrigin.ref.current) {
      return;
    }

    this.readyToDock = false;
    targetStack.pieces.push(pieceOnTopOfOrigin);
    let targetStackCompleted = this.checkIfStackCompleted(targetStack);

    if (targetStackWasBlank) {
      targetStack.bottomRef.current?.setState({
        type: pieceOnTopOfOrigin.type,
      });
    }

    if (dockOrigin?.pieces.length === 0) {
      dockOrigin.bottomRef.current?.setState({
        type: 50,
      });
    }

    if (targetStackCompleted) {
      targetStack.capBlockRef.current?.setState({
        type: pieceOnTopOfOrigin.type,
      });
    }

    const readyForAppearAnim = () => {
      pieceOnTopOfOrigin.ref.current?.setStyle({
        opacity: 1,
        top: topPiecePos.y - Constants.blockHeight.piece * this.scale - 20 * this.scale,
        left: topPiecePos.x
      })
    };

    readyForAppearAnim();
    pieceOnTopOfOrigin.ref.current.animate({
      style: {
        scaleX: 1,
        scaleY: 1,
        left: topPiecePos.x,
        top: topPiecePos.y - Constants.blockHeight.piece * this.scale,
      },
      duration: 300,
      easing: "easeOutBounce"
    }).start();

    if (targetStackCompleted && targetStack.capRef.current) {
      const readyForCapAnim = () => {
        targetStack.capRef.current?.setStyle({
          opacity: 1,
          top: topPiecePos.y -
            Constants.blockHeight.piece * this.scale -
            Constants.blockHeight.top * this.scale -
            20,
        })
      };

      readyForCapAnim();
      targetStack.capRef.current.animate({
        style: {
          scaleX: 1,
          scaleY: 1,
        },
        duration: 100,
        easing: "easeInOutSine"
      }).start(() => {
        targetStack.capRef?.current?.animate({
          style: {
            top: topPiecePos.y -
              Constants.blockHeight.piece * this.scale -
              Constants.blockHeight.top * this.scale,
          },
          duration: 300,
          easing: "easeOutBounce"
        }).start();
      })
    }

    const completeMap = this.getCompleteMap();
    const score = completeMap.filter((bool) => bool).length;
    const completedAllStack = completeMap.filter((bool) => !bool).length === 0;

    if (props.onChange) {
      props.onChange(score);
    }

    if (completedAllStack && props.onComplete) {
      props.onComplete();
    }
  }
  
  dock(stackIndex: number) {
    const {
      stacks,
      dockToSelf,
      dockToOther,
      alertUnableToDock,
      dockOrigin,
    } = this;
    const targetStack = stacks[stackIndex];
    if (targetStack === dockOrigin) {
      dockToSelf(stackIndex);
    } else if (targetStack.pieces.length === targetStack.max) {
      alertUnableToDock(stackIndex);
    } else {
      dockToOther(stackIndex);
    }
    this.dockCount += 1;
  }

  catchLayout(e: LayoutChangeEvent) {
    this.setState({
      ...this.state,
      layout: e.nativeEvent.layout,
    });
    if (this.props.onLayout) {
      this.props.onLayout(e);
    }
  }

  clear() {
    this.setState({
      layout: null,
    })
  }

  render() {
    const {props, catchLayout, state} = this;
    if (!state.layout) {
      return <View onLayout={catchLayout} style={this.props.style} />;
    }

    const scale = props.scale || 1;
    const blockWidth = Constants.blockWidth * scale;
    const blockHeight = Constants.blockHeight.full * scale;

    const maxColumns = Math.floor(
      state.layout.width / (blockWidth + Constants.blockPadding * scale * 2),
    );
    const maxRows = Math.floor(
      state.layout.height / (blockHeight + Constants.blockPadding * scale * 2),
    );

    const leftWidth = state.layout.width - maxColumns * blockWidth;
    const leftHeight = state.layout.height - maxRows * blockHeight;

    const marginHorizontal = (leftWidth / (maxColumns * 2)) * scale;
    const marginVertical = (leftHeight / (maxRows * 2)) * scale;

    const layoutMarginLeft = (state.layout.width - maxColumns * (blockWidth + marginHorizontal * 2)) / 2
    const layoutMarginTop = (state.layout.height - maxRows * (blockHeight + marginVertical * 2)) / 2

    this.scale = scale;
    this.blockWidth = blockWidth;
    this.blockHeight = blockHeight;
    this.maxColumns = maxColumns;
    this.maxRows = maxRows;
    this.marginHorizontal = marginHorizontal;
    this.marginVertical = marginVertical;

    // if (maxRows * maxColumns < props.initialMap.length) {
    //   return (
    //     <View>
    //       <Text>공간이 부족합니다.</Text>
    //     </View>
    //   );
    // }

    const layout = Array(maxRows).fill(Array(maxColumns).fill(1));

    return (
      <View style={this.props.style}>
        <LayoutContainer marginLeft={layoutMarginLeft} marginTop={layoutMarginTop}>
          {layout.map((row, i) => (
            <Row key={'frameRow' + i} style={{marginVertical}}>
              {row.map((cell, j: number) => {
                const stackIndex = layout[0].length * i + j;
                if (props.initialMap[stackIndex] === undefined) {
                  return (
                    <Cell key={'cell' + i + j} scale={scale} style={{marginHorizontal}} />
                  );
                }
                return (
                  <Cell key={'cell' + i + j} scale={scale} style={{marginHorizontal}}>
                    <BlockFrame
                      pieceCount={props.initialMap[stackIndex].length}
                      scale={scale}
                    />
                  </Cell>
                );
              })}
            </Row>
          ))}
        </LayoutContainer>
        <LayoutContainer marginLeft={layoutMarginLeft} marginTop={layoutMarginTop} ref={this.layoutRef}>
          {layout.map((row, i) =>
            row.map((cell, j: number) => {
              const stackIndex = layout[0].length * i + j;
              const curStack = props.initialMap[stackIndex];
              if (curStack === undefined) {
                return <Fragment key={'fragment' + i + j} />;
              }

              const filteredStack = curStack.filter((type) =>
                type === -1 ? false : true,
              );

              const checker: {[index: number]: boolean} = {};
              filteredStack.forEach((type) => (checker[type] = true));
              const completed =
                Object.keys(checker).length === 1 &&
                filteredStack.length === curStack.length;

              const capBlockRef = React.createRef<Block>();
              const capRef = React.createRef<NativeRefBox>();
              const pieces = filteredStack.map((type) => ({
                ref: React.createRef<NativeRefBox>(),
                type,
              }));
              const bottomRef = React.createRef<Block>();
              const stackModel = {
                capBlockRef,
                capRef,
                pieces,
                bottomRef,
                max: curStack.length,
              };
              this.stacks[stackIndex] = stackModel;
              return (
                <Fragment key={'fragment' + i + j}>
                  <AbsoluteRefBox
                    ref={capRef}
                    key={'cap' + i + j}
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                      left:
                        marginHorizontal +
                        j * (blockWidth + marginHorizontal * 2),
                      top:
                        marginVertical +
                        i * (blockHeight + marginVertical * 2) +
                        blockHeight -
                        Constants.blockHeight.bottom * scale -
                        Constants.blockHeight.piece * curStack.length * scale -
                        Constants.blockHeight.top * scale,
                      opacity: completed ? 1 : 0,
                    }}>
                    <Block
                      ref={capBlockRef}
                      base={TopBase}
                      shape={skinMap[props.skin].top}
                      type={
                        filteredStack[0] !== undefined ? filteredStack[0] : 50
                      }
                      scale={scale}
                      visible={true}
                    />
                  </AbsoluteRefBox>
                  {/* This is Block Piece */}
                  {filteredStack.map((type, k) => {
                    return (
                      <AbsoluteRefBox
                        key={'piece' + i + j + k}
                        ref={pieces[k].ref}
                        style={{
                          left:
                            marginHorizontal +
                            j * (blockWidth + marginHorizontal * 2),
                          top:
                            marginVertical +
                            i * (blockHeight + marginVertical * 2) +
                            blockHeight -
                            Constants.blockHeight.bottom * scale -
                            Constants.blockHeight.piece * (k + 1) * scale,
                        }}>
                        <Block
                          base={PieceBase}
                          shape={skinMap[props.skin].piece}
                          type={type}
                          scale={scale}
                        />
                      </AbsoluteRefBox>
                    );
                  })}
                  {/* This is Block Bottom */}
                  <AbsoluteRefBox
                    // ref={bottomRef}
                    key={'bottom' + i + j}
                    style={{
                      left:
                        marginHorizontal +
                        j * (blockWidth + marginHorizontal * 2),
                      top:
                        marginVertical +
                        i * (blockHeight + marginVertical * 2) +
                        blockHeight -
                        Constants.blockHeight.bottom * scale,
                    }}>
                    <Block
                      ref={bottomRef}
                      visible={true}
                      base={BottomBase}
                      shape={skinMap[props.skin].bottom}
                      type={
                        filteredStack[0] !== undefined ? filteredStack[0] : 50
                      }
                      scale={scale}
                    />
                  </AbsoluteRefBox>
                </Fragment>
              );
            }),
          )}
        </LayoutContainer>
        <LayoutContainer marginLeft={layoutMarginLeft} marginTop={layoutMarginTop}>
          {layout.map((row, i) => (
            <Row key={'agentRow' + i} style={{marginVertical}}>
              {row.map((cell, j: number) => {
                const stackIndex = layout[0].length * i + j;
                if (props.initialMap[stackIndex] === undefined) {
                  return (
                    <Cell
                      key={'agentRowCell' + i + j}
                      style={{marginHorizontal}}
                      scale={scale}
                    />
                  );
                }
                return (
                  <Cell key={'agentRowCell' + i + j} scale={scale} style={{marginHorizontal}}>
                    <TouchAgent
                      onTouchStart={() => {
                        if (!this.readyToDock) {
                          this.undock(stackIndex);
                        } else {
                          this.dock(stackIndex);
                        }
                      }}>
                      <BlockFrame pieceCount={Constants.maxStackLength} scale={scale} />
                    </TouchAgent>
                  </Cell>
                );
              })}
            </Row>
          ))}
        </LayoutContainer>
      </View>
    );
  }
}

export default RefBlockBoard;