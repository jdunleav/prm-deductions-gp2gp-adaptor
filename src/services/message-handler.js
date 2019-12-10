import fileSave from '../storage/file-system';
import s3Save from '../storage/s3';
import config from '../config';
import * as mhsGateway from './mhs-gateway';
import * as mhsGatewayFake from './mhs-gateway-fake';
import { generateContinueRequest } from '../templates/continue-template';
import uuid from 'uuid/v4';
import moment from 'moment';
import {
  EHR_EXTRACT_MESSAGE_ACTION,
  extractAction,
  extractConversationId,
  extractFoundationSupplierAsid,
  extractMessageId
} from './message-parser';

const sendContinueMessage = (message, messageId) => {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const continueRequest = generateContinueRequest(
    uuid(),
    timestamp,
    extractFoundationSupplierAsid(message),
    config.deductionsAsid,
    messageId
  );

  return config.isPTL
    ? mhsGateway.sendMessage(continueRequest)
    : mhsGatewayFake.sendMessage(continueRequest);
};

const storeMessage = (message, conversationId, messageId) =>
  config.isLocal
    ? fileSave(message, conversationId, messageId)
    : s3Save(message, conversationId, messageId);

const handleMessage = message => {
  const conversationId = extractConversationId(message);
  const messageId = extractMessageId(message);
  const action = extractAction(message);

  return storeMessage(message, conversationId, messageId).then(() => {
    if (action === EHR_EXTRACT_MESSAGE_ACTION) {
      return sendContinueMessage(message, messageId);
    }
  });
};

export default handleMessage;
