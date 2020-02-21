import request from 'supertest';
import app from '../../app';
import { updateLogEvent, updateLogEventWithError } from '../../middleware/logging';
import { getHealthCheck } from '../../services/get-health-check';

jest.mock('../../config/logging');
jest.mock('../../services/get-health-check');
jest.mock('../../middleware/logging', () => mockLoggingMiddleware());
jest.mock('express-winston', () => mockExpressWinston());

const mockErrorResponse = 'Error: An error has occurred';

// Mocked so need to get real for expectedHealthCheckBase ??
describe('GET /health', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and the response from getHealthCheck', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true)));

    request(app)
      .get('/health')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(expectedHealthCheckBase(true));
      })
      .end(done);
  });

  it('should call health check service with no parameters', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true)));

    request(app)
      .get('/health')
      .expect(() => {
        expect(getHealthCheck).toHaveBeenCalledTimes(1);
      })
      .end(done);
  });

  it('should return 503 status if mhs writable is false', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(false)));

    request(app)
      .get('/health')
      .expect(503)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledWith(expectedHealthCheckBase(false));
      })
      .end(done);
  });

  it('should return 500 if getHealthCheck if it cannot provide a healthcheck', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(new Error('')));

    request(app)
      .get('/health')
      .expect(500)
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
      })
      .end(done);
  });

  it('should update the log event for any unexpected error', done => {
    getHealthCheck.mockReturnValue(Promise.resolve(expectedHealthCheckBase(true)));

    request(app)
      .get('/health')
      .expect(() => {
        expect(updateLogEvent).toHaveBeenCalledTimes(1);
        expect(updateLogEvent).toHaveBeenCalledWith({ status: 'Health check completed' });
      })
      .end(done);
  });
});

function mockExpressWinston() {
  return {
    errorLogger: () => (req, res, next) => next(),
    logger: () => (req, res, next) => next()
  };
}

function mockLoggingMiddleware() {
  const original = jest.requireActual('../../middleware/logging');
  return {
    ...original,
    updateLogEvent: jest.fn(),
    updateLogEventWithError: jest.fn()
  };
}
const expectedHealthCheckBase = mhs_connected => ({
  version: '1',
  description: 'Health of GP2GP Adapter service',
  node_env: process.env.NODE_ENV,
  details: {
    mhs: getExpectedResults(mhs_connected)
  }
});

const getExpectedResults = isWritable => {
  const baseConf = {
    options: {},
    headers: {},
    connected: false
  };
  return !isWritable
    ? {
        ...baseConf,
        headers: {},
        error: mockErrorResponse
      }
    : {
        ...baseConf,
        connected: true
      };
};
