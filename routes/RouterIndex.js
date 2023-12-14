const express = require('express');

const indexRouter = express.Router();

indexRouter.use('/item', require('./ItemsRouter'));



indexRouter.use('/', require('./UserRouter'));

module.exports = indexRouter;