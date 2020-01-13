import { getHealthCheck } from './get-health-check';
import config from '../config';
import { getExpectedResults, mockClient, mockStompit } from '../config/queue.test';
import { S3 } from 'aws-sdk';

jest.mock('stompit');
jest.mock('aws-sdk');
jest.mock('aws-sdk');
jest.mock('../config/logging');
jest.mock('../middleware/logging');

const mockOn = jest.fn();
const mockConnect = jest.fn();
const mockPutObject = jest.fn().mockImplementation((config, callback) => callback());
const mockDeleteObject = jest.fn().mockImplementation((config, callback) => callback());
const mockErrorResponse = 'Error: exhausted connection failover';

describe('get-health-check', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    S3.mockImplementation(() => ({
      putObject: mockPutObject,
      deleteObject: mockDeleteObject
    }));

    mockStompit(mockOn, mockConnect);
  });

  describe('getHealthCheck', () => {
    it('should resolve when both checks are ok', () => {
      mockConnect.mockImplementation(callback => callback(false, mockClient));
      return getHealthCheck().then(result => {
        return expect(result).toStrictEqual(expectedHealthCheckBase(true, true));
      });
    });

    it('should resolve when s3 is not ok', () => {
      mockPutObject.mockImplementation((config, callback) => callback(mockErrorResponse));
      mockConnect.mockImplementation(callback => callback(false, mockClient));

      return getHealthCheck().then(result => {
        return expect(result).toStrictEqual(expectedHealthCheckBase(false, true));
      });
    });

    it('should resolve when MHS is not ok', () => {
      mockPutObject.mockImplementation((config, callback) => callback());
      mockConnect.mockImplementation(callback => callback(mockErrorResponse, null));

      return getHealthCheck().then(result => {
        return expect(result).toStrictEqual(expectedHealthCheckBase(true, false));
      });
    });
  });
});

const expectedS3Base = isWritable => {
  const s3Base = {
    type: 's3',
    bucketName: config.awsS3BucketName,
    available: true,
    writable: isWritable
  };
  return !isWritable
    ? {
        ...s3Base,
        error: mockErrorResponse
      }
    : s3Base;
};

const expectedHealthCheckBase = (s3_writable, mhs_connected) => ({
  version: '1',
  description: 'Health of GP2GP Adapter service',
  node_env: process.env.NODE_ENV,
  details: {
    filestore: expectedS3Base(s3_writable),
    mhs: getExpectedResults(mhs_connected)
  }
});
