require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');  
const app        = express();


app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

app.use(cors({
  // origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']     
}));

app.options('*', cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));  // ← ADD

const routes = require('./routes');
app.use('/api', routes);

const port = process.env.PORT || 9012;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});