import BlockTester from '../screens/dev/BlockTester';
import BlockBoardTester from '../screens/dev/BlockBoardTester';
import EndGameInfoTester from '../screens/dev/EndGameInfoTester';
import GameSceneTester from '../screens/dev/GameSceneTester';
import ItemBoxTester from '../screens/dev/ItemBoxTester';
import ProfileTester from '../screens/dev/ProfileTester';
import PurchaseBoxTester from '../screens/dev/PurchaseBoxTester';
import RankViewerTester from '../screens/dev/RankViewerTester';
import SettingsTester from '../screens/dev/SettingsTester';
import GameScene from '../components/GameScene';
import Main from '../screens/production/Main';
import SelectStage from '../screens/production/SelectStage';
import Shop from '../screens/production/Shop';

interface IRoutes {
  [index: string]: {
    devName: string;
    component: () => JSX.Element;
    type?: 'dev' | 'production';
  };
}
const routes: IRoutes = {
  BlockTester: {
    devName: '블록 테스터',
    component: BlockTester,
  },
  BlockBoardTester: {
    devName: '블록보드 테스터',
    component: BlockBoardTester,
  },
  EndGameInfoTester: {
    devName: '종료 팝업 테스터',
    component: EndGameInfoTester,
  },
  GameSceneTester: {
    devName: '게임씬 테스터',
    component: GameSceneTester,
  },
  ItemBoxTester: {
    devName: '샵 아이템 박스 테스터',
    component: ItemBoxTester,
  },
  ProfileTester: {
    devName: '프로필 테스터',
    component: ProfileTester,
  },
  PurchaseBoxTester: {
    devName: '구매창 테스터',
    component: PurchaseBoxTester,
  },
  RankViewerTester: {
    devName: '랭크 보기 테스터',
    component: RankViewerTester,
  },
  SettingsTester: {
    devName: '설정창 테스터',
    component: SettingsTester,
  },
  PD_GameScene: {
    type: 'production',
    devName: '게임화면',
    component: GameScene,
  },
  PD_Main: {
    type: 'production',
    devName: '메인화면',
    component: Main,
  },
  PD_SelectStage: {
    type: 'production',
    devName: '스테이지 선택 화면',
    component: SelectStage,
  },
  PD_Shop: {
    type: 'production',
    devName: '상점 화면',
    component: Shop,
  },
};

export default routes;
