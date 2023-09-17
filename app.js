const express = require('express');
const { mongoose } = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const csrfProtection = require('csurf')()

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const auth = require('./routes/auth');
app.use(csrfProtection)

app.listen(3000);