import { SupportedSkin } from '../../components/Block/skinMap';
import { SupportedExpression } from '../../components/Profile/Expressions';
import { GlobalReducerActions } from '../actions/global/creator';
import {
  SupportedLanguage,
  GlobalReducerActionTypes,
} from '../actions/global/types';

type GlobalReducerState = {
  language: SupportedLanguage;
  skin: SupportedSkin;
  expressions: {
    top: SupportedExpression;
    bottom: SupportedExpression;
    left: SupportedExpression;
    right: SupportedExpression;
    center: SupportedExpression;
  }
};

const initialState: GlobalReducerState = {
  language: SupportedLanguage.ko,
  skin: "basic",
  expressions: {
    top: "like",
    bottom: "trophy",
    right: "meh",
    left: "heart",
    center: "sad",
  }
};

const reducer = (state = initialState, action: GlobalReducerActions) => {
  const newState = {...state};
  if (action.type === GlobalReducerActionTypes.SET_LANGUAGE) {
    newState.language = action.payload;
  }

  if (action.type === GlobalReducerActionTypes.SET_SKIN) {
    console.log(action);
    newState.skin = action.payload;
  }

  if (action.type === GlobalReducerActionTypes.SET_EXPRESSION) {
    const {direction, name} = action.payload;
    newState.expressions[direction] = name;
  }

  return newState;
};

export default reducer;
