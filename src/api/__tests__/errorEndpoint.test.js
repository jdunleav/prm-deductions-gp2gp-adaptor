import request from 'supertest';
import app from '../../app';
import { updateLogEventWithError } from '../../middleware/logging';

jest.mock('../../config/logging');
jest.mock('../../middleware/logging');

describe('GET /error', () => {
  it('should return 200', done => {
    request(app)
      .get('/error')
      .expect(201)
      .expect(res => {
        expect(res.text).toEqual('Added test Error to the log');
      })
      .end(done);
  });

  it('should log event with error', done => {
    request(app)
      .get('/error')
      .expect(201)
      .expect(() => {
        expect(updateLogEventWithError).toHaveBeenCalledTimes(1);
        expect(updateLogEventWithError).toHaveBeenCalledWith(
          Error('TEST: GP2GP Adaptor Error logging test entry')
        );
      })
      .end(done);
  });
});
