/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { Box, Grid } from '@mui/material';
import SideBar from '../components/SideBar';
import ChatWindow from '../components/chat/ChatWindow';
import {
  AudioHandles,
  ChatLogMessage,
  SelectModel,
} from '../../main/types/app-types';

function HomeBody() {
  return <ChatWindow />;
}

export default HomeBody;
