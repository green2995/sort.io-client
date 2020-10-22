import React, { RefObject } from 'react'
import { View, Text, Animated, Easing, TouchableOpacityProps } from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../../router/routes'
import { RouteProp, CommonActions } from '@react-navigation/native'
import { RoundPaddingCenter, NotoSans, FullFlexCenter, FlexHorizontal, Space } from '../../../components/Generic/StyledComponents'
import { BeforeRemoveEvent } from '../GameScreen/utils'
import useMultiGameSocket from '../../../hooks/useMultiGameSocket'
import socketClientActions, { cancelRequestRematch, declineRequestRematch } from '../../../hooks/useMultiGameSocket/action/creator'
import usePlayData from '../../../hooks/usePlayData'
import Logger from '../../../components/Logger'
import RematchStatusAnimation from './RematchWaitingPopup/RematchStatusAnimation'
import RematchLogger, { RematchMessage } from './RematchWaitingPopup/RematchLogger'
import RematchStatusPlayerAnimation from './RematchWaitingPopup/RematchStatusAnimation/RematchStatusPlayerAnimation'
import { set } from 'd3'
import { TouchableOpacity } from 'react-native-gesture-handler'
import chroma from 'chroma-js'

type RematchWaitingPopupRouteProps = RouteProp<RootStackParamList, "Popup_RematchWaiting">

type RematchWaitingPopupNavigationProps = StackNavigationProp<RootStackParamList, "Popup_RematchWaiting">

export type RematchWaitingPopupParams = {
  beingInvited: boolean;
};

type RematchWaitingPopupProps = {
  navigation: RematchWaitingPopupNavigationProps;
  route: RematchWaitingPopupRouteProps;
}

type ButtonProps = {
  backgroundColor: string;
  color?: string;
  text?: string;
}

const Button: React.FC<ButtonProps & TouchableOpacityProps> = (props) => (
  <TouchableOpacity {...props}>
    <RoundPaddingCenter
      style={{
        backgroundColor: props.backgroundColor,
        borderWidth: 3,
        width: 80,
        alignItems: 'center',
        borderColor: chroma(props.backgroundColor)
          .set('hsl.l', chroma(props.backgroundColor).get('hsl.l') - 0.2)
          .hex(),
      }}
    >
      <NotoSans color={props.color || 'black'} type="Bold">{props.text || props.children}</NotoSans>
    </RoundPaddingCenter>
  </TouchableOpacity>
)

const RematchWaitingPopup = (props: RematchWaitingPopupProps) => {
  const socket = useMultiGameSocket();
  const {players, roomId} = socket.getRoomData();
  const playData = usePlayData();
  const userId = playData.user.id as number;
  const opponent = players.filter((player) => player.id !== userId)[0];
  const animationRef = React.createRef<RematchStatusAnimation>();
  const loggerRef = React.createRef<Logger>();
  const { beingInvited } = props.route.params;
  let closedPopup = false;
  let pressedAccept = false;
  let beenInformedToPrepare = false;

  const addMessage = (message: RematchMessage) => {
    loggerRef.current?.addMessage(message)
  }

  const setUserAnim = () => {
    const playerRef = animationRef.current?.playerRef;
    const opponentRef = animationRef.current?.opponentRef;

    const extractUsefulMethods = (ref?: RefObject<RematchStatusPlayerAnimation>) => {
      const fallback = () => {};
      return {
        askRematch: ref?.current?.askRematch || fallback,
        disagreeRematch: ref?.current?.disagreeRematch || fallback,
        agreeRematch: ref?.current?.agreeRematch || fallback,
        think: ref?.current?.think || fallback,
        popCommentBox: ref?.current?.popCommentBox || fallback,
        popMessage: ref?.current?.popMessage || fallback,
        startWave: ref?.current?.startWave || fallback,
        stopWave: ref?.current?.stopWave || fallback,
      }
    }

    return {
      player: extractUsefulMethods(playerRef),
      opponent: extractUsefulMethods(opponentRef),
    }
  }

  type AnimOwner = keyof ReturnType<typeof setUserAnim>;
  type AnimKeys = keyof ReturnType<typeof setUserAnim>[AnimOwner];

  const animate = (speaker: AnimOwner, anim: AnimKeys) => {
    const listener = speaker === "opponent" ? "player" : "opponent";
    setUserAnim()[listener].stopWave();
    setUserAnim()[speaker][anim]();
    setUserAnim()[speaker].popCommentBox();
    setUserAnim()[speaker].startWave();
  }

  const onAcceptPressed = () => {
    if (!pressedAccept) {
      socket.send(socketClientActions.acceptRematch({
        roomId,
        userId,
      }))
      animate("player", "agreeRematch");
      addMessage({
        ownerId: userId,
        text: `${playData.user.name}이(가) 재대결을 수락했다!`
      });
    }

    pressedAccept = true;
  };

  const renderButtons = () => {
    if (beingInvited) {
      return (
        <>
          <Button
            backgroundColor="dodgerblue"
            text="수락"
            color="white"
            onPress={onAcceptPressed}
          />
          <Space width={10} />
          <Button
            backgroundColor="bisque"
            text="거절"
            onPress={props.navigation.goBack}
          />
        </>
      )
    } else {
      return (
        <>
          <Button
            backgroundColor="slategrey"
            color="white"
            text="취소"
            onPress={props.navigation.goBack}
          />
        </>
      )
    }
  }

  React.useEffect(() => {
    const cancelRematchAskListener = socket
      .addListener("onCancelRematchAsk",  () => {
        animate("opponent", "disagreeRematch");
        addMessage({
          ownerId: opponent.id,
          text: `${opponent.name}이(가) 재대결 요청을 철회했다!`
        })
        if (!closedPopup) {
          closedPopup = true;
          setTimeout(() => {
            props.navigation.pop();
          }, 2000);
        }
      })

    const alertRematchDeclinedListener = socket
      .addListener("onAlertRematchDeclined", () => {
        animate("opponent", "disagreeRematch");
        addMessage({
          ownerId: opponent.id,
          text: `${opponent.name}이(가) 재대결을 거부했다!`
        })
        if (!closedPopup) {
          closedPopup = true;
          setTimeout(() => {
            props.navigation.pop();
          }, 2000);
        }
      })

    const informRematchAcceptedListener = socket
      .addListener("onInformRematchAccepted", () => {
        animate("opponent", "agreeRematch");
        addMessage({
          ownerId: opponent.id,
          text: `${opponent.name}이(가) 재대결을 수락했다!`
        })
      })

    const sendRoomListener = socket
      .addListener("onSendRoom", () => {
        socket.send(socketClientActions.informReceivedMap({
          userId,
          roomId
        }))

        addMessage({
          ownerId: -1,
          text: '새로운 블록 맵을 만들고 있습니다'
        })
      })

    const informPrepareRematchListener = socket
      .addListener("onInformPrepareRematch", () => {
        addMessage({
          ownerId: -1,
          text: `재대결이 곧 시작됩니다!`
        })
        setTimeout(() => {
          if (!beenInformedToPrepare) {
            const {map, mapDesc} = socket.getRoomData();
            unsubscribeBeforeRemove();
            props.navigation.dispatch((state) => {
              const routes: typeof state.routes = [
                ...state.routes.slice(state.routes.length - 2),
                {
                  key: `MultiGame-${Date.now()}`,
                  name: "MultiGame",
                  params: {
                    map,
                    mapDesc,
                  }
                }
              ];
              return CommonActions.reset({
                ...state,
                routes,
                index: routes.length - 1,
              });
            });
          }

          beenInformedToPrepare = true;
        })
      })

    const unsubscribeBeforeRemove = props.navigation
      .addListener("beforeRemove", (e: BeforeRemoveEvent) => {
        if (e.data.action.type === "GO_BACK") {
          e.preventDefault();
          if (!beingInvited) {
            socket.send(cancelRequestRematch({
              roomId,
              userId,
            }))
            animate("player", "disagreeRematch");
            addMessage({
              ownerId: userId,
              text: `${playData.user.name}이(가) 재대결 요청을 철회했다!`
            });
            if (!closedPopup) {
              closedPopup = true;
              setTimeout(() => {
                props.navigation.pop();
              }, 2000);
            }
          } else {
            socket.send(declineRequestRematch({
              roomId,
              userId,
            }))
            animate("player", "disagreeRematch");
            addMessage({
              ownerId: userId,
              text: `${playData.user.name}이(가) 재대결을 거부했다!`
            });
            if (!closedPopup) {
              closedPopup = true;
              setTimeout(() => {
                props.navigation.pop();
              }, 2000);
            }
          }
        }
      })

    if (beingInvited) {
      animate("opponent", "askRematch");
      setUserAnim().player.think();
      addMessage({
        ownerId: opponent.id,
        text: `${opponent.name}은(는) 재대결을 요청했다!`
      });
    } else {
      animate("player", "askRematch");
      setUserAnim().opponent.think();
      addMessage({
        ownerId: userId,
        text: `${playData.user.name}은(는) 재대결을 요청했다!`
      });
    }

    return () => {
      socket.removeListener(cancelRematchAskListener);
      socket.removeListener(alertRematchDeclinedListener);
      socket.removeListener(informRematchAcceptedListener);
      socket.removeListener(sendRoomListener);
      socket.removeListener(informPrepareRematchListener);
      unsubscribeBeforeRemove();
    }
  })

  return (
    <FullFlexCenter>
      <RoundPaddingCenter>
        <RematchStatusAnimation ref={animationRef} />
        <RematchLogger ref={loggerRef} />
        <FlexHorizontal style={{marginTop: 10, justifyContent: 'center'}}>
          {renderButtons()}
        </FlexHorizontal>
      </RoundPaddingCenter>
    </FullFlexCenter>
  )
}

export default RematchWaitingPopup