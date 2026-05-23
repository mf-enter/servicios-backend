import { Router } from 'express';
import { acceptQuote, cancelQuote, getQuotesByService } from '../controllers/QuoteController.js';
import { authToken } from '../middleware/authToken.js';

const router = Router();

router.get('/service/:serviceId', authToken, getQuotesByService);
router.post('/:id/accept', authToken, acceptQuote);
router.post('/:id/cancel', authToken, cancelQuote);

export default router;
