import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import styled from 'styled-components';
import colorTheme from './ColorTheme';
import {BasicBlockProps} from '../Types';

const BaseContainer = styled(View)`
  height: 24px;
  margin-left: -6px;
`;

const SvgContainer = styled(View)`
  margin-top: 0px;
`;

const SpikyPiece = (props: BasicBlockProps) => {
  const {bodyFill, spike} = colorTheme[props.type];
  return (
    <BaseContainer>
      <SvgContainer>
        <Svg width="78" height="34" viewBox="0 0 78 34">
          <Path
            d="M77 13L70.25 3.47372L70.25 22.5263L77 13Z"
            fill={spike}
            stroke="black"
          />
          <Path
            d="M0.999999 13L7.75 3.47372L7.75 22.5263L0.999999 13Z"
            fill={spike}
            stroke="black"
          />
          <Path
            d="M7 1H23V9H55V1H71V25H55V33H23V25H7V1Z"
            fill={bodyFill}
            stroke="black"
          />
          <Rect
            x="13.5"
            y="5.5"
            width="7"
            height="7"
            fill="white"
            stroke="black"
          />
          <Rect
            x="57.5"
            y="5.5"
            width="7"
            height="7"
            fill="white"
            stroke="black"
          />
          <Rect x="15" y="7" width="4" height="4" fill="black" />
          <Rect x="59" y="7" width="4" height="4" fill="black" />
        </Svg>
      </SvgContainer>
    </BaseContainer>
  );
};

export default SpikyPiece;
