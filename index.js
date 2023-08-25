var con = require("./connection");
var express = require("express");
var { body, validationResult } = require("express-validator");
var session = require("express-session"); // Add session module
var app = express();
var path = require('path'); // Import the path module
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use the session middleware
app.use(session({
    secret: ' 8b73e60302469b744aadd959f82eb912ebe7c10199629f5673da878094c2c9d6', // Change this to a secure secret key
    resave: false,
    saveUninitialized: true
  }));

app.use(express.static(__dirname));

app.get('/', function (req, res) {
    res.render('index');
    
   

   
});






app.post('/', [
    // Express Validator middleware for form validation
    body('username').notEmpty().withMessage('Username is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('password2').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords don't match");
        }
        return true;
    }),
], function (req, res) {
    var errors = validationResult(req);

    if (!errors.isEmpty()) {
        // If validation errors, return error messages to the client
        var errorMessages = errors.array().map(error => error.msg); // Extract error messages
        return res.status(400).send(errorMessages.join(', ')); // Send error messages as plain text
       
    }

    var username = req.body.username;
    var department = req.body.department;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;

    con.connect(function (error) {
        if (error) throw error;

        var sql = "INSERT INTO employeedetails(username, department, email, password, password2) VALUES ('" + username + "', '" + department + "', '" + email + "', '" + password + "', '" + password2 + "')";

        con.query(sql, function (error, result) {
            if (error) throw error;
            res.send("You are Registered with Branch Karma Successfully");
            
        });
    });

});

app.set('view engine', 'ejs'); // Set the view engine to EJS (or your chosen view engine)
app.set('views', path.join(__dirname, 'views')); // Set the directory where your views are located

app.get('/login', function (req, res) {
  res.render('login');
  
 

 
});

 app.post('/login', function (req, res) {
   
  var username = req.body.username;
  var department = req.body.department;
  var password = req.body.password;

  // Check for empty fields
  if (!username || !department || !password) {
    res.render('login', { error: 'Please fill in all fields' });
    return;
  }

    con.connect(function (error) {
      if (error) throw error;
  
      var sqlselect = "SELECT * FROM employeedetails WHERE username = ? AND department = ? AND password = ?";
      var values = [username, department, password];
      
      con.query(sqlselect, values, function (error, results) {
        if (error) throw error;
  
        

        if (results.length === 1) {
          // Set login timestamp
        const loginTime = new Date();
          
        req.session.loggedIn = true; // Set a session flag to indicate the user is logged in
        req.session.username = username;
        req.session.loginTime = loginTime;
        // Update the database with login timestamp
        const updateLoginTimeQuery = "UPDATE employeedetails SET login_time = ? WHERE username = ?";
        con.query(updateLoginTimeQuery, [loginTime, username], function (error, result) {
            if (error) throw error;  
        res.redirect('loggedin'); // Redirect to the "Logged In" page
        });
      }else {
          res.render('login', { error: 'Invalid credentials' });
            // Render login page with error message
          
        }
      });
    });
  });
  
  app.get('/loggedin', function (req, res) {
    if (req.session.loggedIn) {
      res.render('loggedin');
    } else {
      res.send('You are not logged in');
    }
  });

 // New route for handling logout



// New route for handling logout
app.get('/logout', function (req, res) {
  if (req.session.loggedIn) {
      const logoutTime = new Date();
      const username = req.session.username; // Assuming you have stored the username in the session
      
      // Update the database with logout timestamp
      const updateLogoutTimeQuery = "UPDATE employeedetails SET logout_time = ? WHERE username = ?";
      con.query(updateLogoutTimeQuery, [logoutTime, username], function (error, result) {
          if (error) {
              console.error('Error updating logout time:', error);
          }
          req.session.destroy(function (err) {
              if (err) {
                  console.error('Error destroying session:', err);
              }
              res.redirect('/login'); // Redirect to the login page after logout
          });
      });
  } else {
      res.redirect('/login'); // Redirect to the login page if not logged in
  }
});

app.listen(7000);
