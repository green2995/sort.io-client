import React from 'react'
import { View, Dimensions } from 'react-native'
import Logo from '../../components/Logo'
import VolumeControl from '../../components/Main/VolumeControl'
import MoneyIndicator from '../../components/Main/MoneyIndicator'
import MainButton from '../../components/Main/MainButton'
import PatternBackground from '../../components/GameScene/PatternBackground'
import Icon from 'react-native-vector-icons/FontAwesome'
import styled from 'styled-components'
import { useNavigation, RouteProp, CommonActions } from '@react-navigation/native'
import usePlayData from '../../hooks/usePlayData'
import { FlexHorizontal, Space, NotoSans, Line } from '../../components/Generic/StyledComponents'
import { useDispatch } from 'react-redux'
import { loadPlayData, signInWithGoogle, signOutWithGoogle } from '../../redux/actions/playData/thunk'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../router/routes'
import AnimationController from '../../components/AnimationController'
import GoogleSigninController from '../../components/GoogleSigninController'

const backgroundImage = require('../../assets/BackgroundPattern.png');

const ButtonIcon: typeof Icon = styled(Icon)`
  position: absolute;
  left: 20px;
  font-size: 30px;
`;

type MainNavigationProp = StackNavigationProp<RootStackParamList, 'PD_Main'>
type MainRouteProp = RouteProp<RootStackParamList, 'PD_Main'>

type MainProps = {
  navigation: MainNavigationProp;
  route: MainRouteProp;
}

const Main = (props: MainProps) => {
  const navigation = props.navigation;
  const playData = usePlayData();
  const dispatch = useDispatch();

  if (!playData.loaded) {
    dispatch(loadPlayData());
  }

  const onPressSingle = () => navigation.navigate('PD_SelectStage');

  const onPressMulti = () => navigation.navigate('Popup_MultiWaiting');

  const onPressShop = () => navigation.navigate("PD_Shop");

  return (
    <View style={{flex: 1, backgroundColor: 'grey'}}>
      <PatternBackground source={backgroundImage}/>
      <View style={{position: 'absolute', left: 10, top: 10}}>
        <FlexHorizontal>
          <AnimationController/>
          <Line width={0.5} height='80%' marginHorizontal={10} color="rgba(255,255,255,0.5)" />
          <GoogleSigninController/>
        </FlexHorizontal>
      </View>
      <View style={{ position: 'absolute', right: 10, top: 10 }}>
        <MoneyIndicator value={playData.loaded ? playData?.user.gold : 0} />
      </View>
      <View style={{alignItems: 'center', marginTop: 120, marginBottom: 40}}>
        <Logo fontSize={60} strokeWidth={2} color="white" strokeColor="rgba(0,0,0,0.2)" />
        <FlexHorizontal>
          <NotoSans type="Bold" color="yellow">Welcome! </NotoSans>
          <NotoSans type="Black" color="white">{playData.user.name}</NotoSans>
        </FlexHorizontal>
      </View>
      <View style={{alignItems: 'center'}}>
        <MainButton
          preComponent={<ButtonIcon name="gamepad" color="tomato" />}
          text="싱글 플레이"
          onPress={onPressSingle}
        />
        <MainButton
          preComponent={<ButtonIcon name="users" color="mediumseagreen" />}
          text="멀티 플레이"
          onPress={onPressMulti}
        />
        <MainButton
          preComponent={<ButtonIcon name="shopping-basket" color="cornflowerblue" />}
          text="상점"
          onPress={onPressShop}
        />
        <MainButton
          preComponent={<ButtonIcon name="trophy" color="goldenrod" />}
          text="리더보드"
          onPress={() => { }}
        />
      </View>
    </View>
  )
}

export default Main
