var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser'); // exposes the req.cookies property
var logger = require('morgan');
// require passport to make authentication / authorization easier
const passport = require('passport');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
//add a new const for the examples.js router
const examplesRouter = require('./routes/examples')
const secureRouter = require('./routes/secure');
const stateRouter = require('./routes/state');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// configure passport to create the req.currentUser property with the token payload
// in order to use passport with express we need to initialize passport
app.use(passport.initialize({userProperty: 'currentUser'}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// add the following line to point to the folder that contains the bootswatch css files
app.use('/bw', express.static(__dirname + '/node_modules/bootswatch/dist'))
// add a new path called examples that uses the code in the examples.js file for routing
app.use('/examples', examplesRouter)
app.use('/secure', secureRouter);
app.use('/state', stateRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
