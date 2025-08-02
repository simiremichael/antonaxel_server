import express, { json } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import ordersRouter from './routes/orders.js';
import getOrdersRouter from './routes/getOrders.js';



const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  credentials: true,
    origin: ['https://www.antonaxel.com.ng', 'http://localhost:8000', 
    ],
    headers: 'x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, authorization, userauthorization,userAuthorization, comauthorization, comAuthorization, *'
}));

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body Parsing
app.use(json({ limit: '10kb' }));

// Routes
app.use('/api/orders', ordersRouter);

app.use("/api/getOrders", getOrdersRouter); 

// Health Check
app.get('/health', (req, res) => res.sendStatus(200));

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;