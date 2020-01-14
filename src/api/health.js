import express from 'express';
import { updateLogEvent, updateLogEventWithError } from '../middleware/logging';
import { getHealthCheck } from '../services/get-health-check';

const router = express.Router();

router.get('/', (req, res, next) => {
  getHealthCheck()
    .then(status => {
      updateLogEvent({ status: 'Health check completed' });

      if (
        status.details.filestore.writable &&
        status.details.mhs.connected &&
        status.details.filestore.available
      ) {
        res.status(200).send(status);
      } else {
        updateLogEvent(status);
        res.status(503).send(status);
      }
    })
    .catch(err => {
      updateLogEventWithError(err);
      next(err);
    });
});

export default router;
