
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Connect to MongoDB
db = require('mongojs').connect('blog', ['post']);
//var db = mongojs('mydb', ['mycollection']);

app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//Routing
app.get('/', function(req, res){
  res.render('index', {
    title: 'Home'
  });
});

app.get('/about', function(req, res){
  res.render('about', {
    title: 'About'
  });
});

app.get('/contact', function(req, res){
  res.render('contact', {
    title: 'Contact'
  });
});

// Routes

function isUser(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    next(new Error('You must be user to access this page'));
  }
}

//MongoDB data strucutre
app.get('/', function(req, res) {
  var fields = { subject: 1, body: 1, tags: 1, created: 1, author: 1 };
  db.post.find({ state: 'published'}, fields, function(err, posts) {
    if (!err && posts) {
      res.render('index.jade', { title: 'Blog list', postList: posts });
    }
  });
});


// Route param pre condition
app.param('postid', function(req, res, next, id) {
  if (id.length != 24) return next(new Error('The post id is not having correct length'));
 
  db.post.findOne({ _id: db.ObjectId(id) }, function(err, post) {
    if (err) return next(new Error('Make sure you provided correct post id'));
    if (!post) return next(new Error('Post loading failed'));
    req.post = post;
    next();
  });
});
 
app.get('/post/:postid', function(req, res) {
  res.render('show.jade', {
    title: 'Showing post - ' + req.post.subject,
    post: req.post
  });
});

// Add comment
app.post('/post/comment', function(req, res) {
  var data = {
      name: req.body.name
    , body: req.body.comment
    , created: new Date()
  };
  db.post.update({ _id: db.ObjectId(req.body.id) }, {
    $push: { comments: data }}, { safe: true }, function(err, field) {
      res.redirect('/');
  });
});

// Login
app.get('/login', function(req, res) {
  res.render('login.jade', {
    title: 'Login user'
  });
});
 

app.post('/login', function(req, res) {
  var select = {
      user: req.body.username
    , pass: crypto.createHash('sha256').update(req.body.password + conf.salt).digest('hex')
  };
 
  db.user.findOne(select, function(err, user) {
    if (!err && user) {
      // Found user register session
      req.session.user = user;
      res.redirect('/');
    } else {
      // User not found lets go through login again
      res.redirect('/login');
    }
 
  });
});


app.get('/post/add', isUser, function(req, res) {
  res.render('add.jade', { title: 'Add new blog post '});
});
 
app.post('/post/add', isUser, function(req, res) {
  var values = {
      subject: req.body.subject
    , body: req.body.body
    , tags: req.body.tags.split(',')
    , state: 'published'
    , created: new Date()
    , modified: new Date()
    , comments: []
    , author: {
        username: req.session.user.user
    }
  };
 
  db.post.insert(values, function(err, post) {
    console.log(err, post);
    res.redirect('/');
  });
});


app.get('/post/edit/:postid', isUser, function(req, res) {
res.render('edit.jade', { title: 'Edit post', blogPost: req.post } );
});
 
app.post('/post/edit/:postid', isUser, function(req, res) {
db.post.update({ _id: db.ObjectId(req.body.id) }, {
$set: {
subject: req.body.subject
, body: req.body.body
, tags: req.body.tags.split(',')
, modified: new Date()
}}, function(err, post) {
res.redirect('/');
});
});


app.get('/post/delete/:postid', isUser, function(req, res) {
  db.post.remove({ _id: db.ObjectId(req.params.postid) }, function(err, field) {
    res.redirect('/');
  });
});