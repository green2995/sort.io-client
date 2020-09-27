import { CommonActions } from "@react-navigation/native";
import { MutableRefObject, RefObject } from "react";
import { View } from "react-native";
import GameScene from "../../../../components/GameScene";
import useMultiGameSocket from "../../../../hooks/useMultiGameSocket";
import socketClientActions from "../../../../hooks/useMultiGameSocket/action/creator";
import { AlertDockConstructor } from "../../../../hooks/useMultiGameSocket/ServerMessages";
import usePlayData from "../../../../hooks/usePlayData";
import { MultiGameProps } from "../../MutiGame";

type MultiGameSocketLogicParams = {
  playData: ReturnType<typeof usePlayData>,
  socket: ReturnType<typeof useMultiGameSocket>,
  props: MultiGameProps,
  gameSceneRef: RefObject<GameScene>,
  containerRef: RefObject<View>,
  gameStarted: MutableRefObject<boolean>,
}

const multiGameSocketLogic = (param: MultiGameSocketLogicParams) => {
  const {
    playData,
    socket,
    props,
    containerRef,
    gameSceneRef,
    gameStarted,
  } = param;
  const { roomId } = socket.getRoomData();

  const sendDockMessage = (stackIndex: number, action: 'DOCK' | 'UNDOCK') => {
    if (!playData.user.id) return;
    socket.send(socketClientActions.dock({
      userId: playData.user.id,
      stackIndex: stackIndex,
      roomId: roomId,
      action,
    }));
  }

  const sendSuccessMessage = () => {
    if (!playData.user.id) return;
    socket.send(socketClientActions.success({
      userId: playData.user.id,
      roomId: roomId,
    }));
  }

  const sendReadyMessage = () => {
    if (!playData.user.id) return;
    socket.send(socketClientActions.alertReady({
      roomId: roomId,
      userId: playData.user.id
    }));
  }

  const sendUpdateScoreMessage = (owner: "me" | "opponent", score: number) => {
    if (owner === "me" && playData.user.id) {
      socket.send(socketClientActions.updateScore({
        roomId,
        userId: playData.user.id,
        score,
      }))
    }
  }


  const errorListener = socket.addListener("onError",
    (err: WebSocketErrorEvent) => {
      props.navigation.dispatch((state) => {
        return CommonActions.reset({
          ...state,
          routes: [
            {
              name: "PD_Main",
              key: "PD_Main" + Date.now(),
            },
            {
              name: "Popup_OpponentLeft",
              key: "Popup_OpponentLeft" + Date.now(),
            }
          ],
          index: 1,
        })
      })
    })

  const informOpponentHasLeftListener = socket.addListener("onInformOpponentHasLeft",
    () => {
      props.navigation.dispatch((state) => {
        const routes: typeof state.routes = state.routes
          .filter((route) => {
            const routesToStay = ["PD_Main", "PD_MultiGame"]
            if (routesToStay.indexOf(route.name) !== -1) {
              return true;
            } else {
              return false;
            }
          })
          .concat([{
            key: "Popup_GameResult" + Date.now(),
            name: "Popup_GameResult",
            params: {
              result: 'draw',
              opponentHasLeft: true,
            }
          }]);
        socket.removeListener(informOpponentHasLeftListener);
        return CommonActions.reset({
          ...state,
          routes,
          index: routes.length - 1,
        });
      })
    })

  const alertDockListener = socket.addListener("onAlertDock",
    (data: AlertDockConstructor) => {
      const { userId, stackIndex, action } = data;
      const $opponentBoard = gameSceneRef.current?.opponentBoardRef.current;
      if (userId !== playData.user.id) {
        if (action === "UNDOCK") {
          $opponentBoard?.undock(stackIndex);
        }
        if (action === "DOCK") {
          $opponentBoard?.dock(stackIndex);
        }
      }
    })

  const alertPrepareListener = socket.addListener("onAlertPrepare",
    () => {
      props.navigation.navigate("Popup_Prepare");
      containerRef.current?.setNativeProps({
        pointerEvents: "auto"
      })
    })

  const deleteRoomListener = socket.addListener("onDeleteRoom",
    () => {
      // props.navigation.dispatch((state) => {
      //   return CommonActions.reset({
      //     ...state,
      //     routes: [{
      //       name: "PD_Main",
      //       key: "PD_Main" + Date.now(),
      //     }],
      //     index: 0,
      //   })
      // })
    })

  const informWinnerListener = socket.addListener("onInformWinner",
    (winnerId: number) => {
      const hasWon = playData.user.id === winnerId;
      const gameResult = winnerId === -1
        ? 'draw'
        : hasWon ? 'win' : 'lose';
      props.navigation.dispatch((state) => {
        const routes: typeof state.routes = state.routes.concat([{
          key: "Popup_GameResult" + Date.now(),
          name: "Popup_GameResult",
          params: {
            result: gameResult,
          },
        }]);
        return CommonActions.reset({
          ...state,
          routes,
          index: routes.length - 1,
        });
      })
    })

  const syncTimerListener = socket.addListener("onSyncTimer",
    (leftTime: number) => {
      if (!gameStarted.current) {
        gameStarted.current = true;
      }
      const $TimerBase = gameSceneRef.current?.timerRef.current?.timerBaseRef.current;
      $TimerBase?.setTimeTo(leftTime);
    })

  return {
    sendDockMessage,
    sendSuccessMessage,
    sendReadyMessage,
    sendUpdateScoreMessage,
    errorListener,
    informOpponentHasLeftListener,
    alertDockListener,
    alertPrepareListener,
    deleteRoomListener,
    informWinnerListener,
    syncTimerListener,
  }
}

export default multiGameSocketLogic;