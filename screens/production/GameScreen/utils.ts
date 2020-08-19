export type GameMode = 'single' | 'multi';
export type GameSubType = 'challenge' | 'training';

export enum GameLevel {
  Dust = 0,
  Stone = 3,
  Iron = 6,
  Bronze = 9,
  Silver = 12,
  Gold = 18,
  Platinum = 24,
  Diamond = 30,
  Master = 36,
  GrandMaster = 42,
  Challenger = 48,
  GrandChallenger = 54,
  Champion = 60,
  GrandChampion = 66,
  Demigod = 72,
  Omnia = 78,
  God = 84,
  Uno = 90,
  Nihil = 96,
};

const _getLeveEnumNumArr = (level: number) => {
  return Object.keys(GameLevel)
    .filter((str) => str.match(/\d/g))
    .map((str) => Number(str));
}

const _getLevelEnumNum = (level: number) => {
  return _getLeveEnumNumArr(level)
    .filter((num) => num <= level)
    .reduce((acc, ele) => {
      if (ele > acc) return ele;
      return acc;
    })
}

export const getLevelIndex = (level: number) => {
  const levelEnumNumArr = _getLeveEnumNumArr(level);
  const levelEnumNum = _getLevelEnumNum(level);
  const levelIndex = levelEnumNumArr.indexOf(levelEnumNum);
  return levelIndex;
}

export const getLevelString = (level: number) => {
  const levelEnumNum = _getLevelEnumNum(level);
  const levelEnumStr = GameLevel[levelEnumNum];
  const subLevel = level - levelEnumNum + 1;
  const levelStr = `${levelEnumStr} ${subLevel}`;
  return levelStr;
}

export const generateOptionByLevel = (level: number) => {
  const levelIndex = getLevelIndex(level);
  const levelStr = getLevelString(level);
  const levelEnumNum = _getLevelEnumNum(level);
  const map = {
    blockStackCount: levelIndex + 3,
    colorCount: levelIndex + 2,
    maxScore: levelIndex + 2,
    stackLengthMax: 8,
    stackLengthMin: Math.min(levelIndex + 2, 5),
    shuffleCount: 100,
  }
  return {
    map,
    time: 120 / (levelEnumNum | 1),
    levelStr,
  };
}
