const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")

const app = express();
app.set("view engine" , "ejs" );
app.use(bodyParser.urlencoded({ extended : true }))
app.use(express.static("public"));
app.use(session({// This just enables us to use the session 
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }))

  // We are now connecting passport package with the express-session . 
  app.use(passport.initialize());
  app.use(passport.session());  

mongoose.connect("mongodb://localhost:27017/secretDB", { useNewUrlParser : true , useUnifiedTopology :true });
mongoose.set('useCreateIndex', true);

const registeredSchema = new mongoose.Schema({//this new mongoose new schema method shold be used to create a schema
    email:String,
    password:String
});

//We are just pluging in the new plugin to the scheme to make use of the passport package with the mongoose db
registeredSchema.plugin(passportLocalMongoose)

const Users = mongoose.model( "user" , registeredSchema);

//Here we are writing this code to hook up passport with the mongoose database 
passport.use(Users.createStrategy());

// when we tell to seralize it enables us to create a new cookie in which we can store user information
passport.serializeUser(Users.serializeUser());
// By deserializing the user it enables us to take the data user has left behind in the cookie
passport.deserializeUser(Users.deserializeUser());


app.get("/",(req,res)=>{
   res.render("home")
});

app.get("/secrets" ,(req,res)=>{
    if(req.isAuthenticated()==true){
        res.render("secrets")
    }
    else{
        res.redirect("/login")
    }
})

app.route("/register")
   .get((req,res)=>{
      res.render("register")
   })
   .post((req,res)=>{
       console.log(req.body);
       //Here we are just creating a new user and adding him up to our database .
      Users.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
            
          //Here we are just creating a cookie to rember the user has registered  
          passport.authenticate("local")(req, res, function(){
            res.redirect("/");
          });
        }
     })
   })

 app.route("/login")  
    .get((req,res)=>{
        res.render("login")
    })
    .post((req,res)=>{
        //here we are getting a post request from the user and we take the username and the password and create a new 
        //object with it
        const user = new Users({
            username:req.body.username,
            password:req.body.password
        })

        //Now we take the object we just created and call the method login on it and then pass the object as a parameter
        req.login(user,function(err){
            if (err) {
                console.log(err);
            }
            //We are just creating a cookie for his browsing session , to rember that he is logged in
            else{
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                  });
            }
        })
    })



app.listen(3000,(req,res)=>{
    console.log("Succesfully hosted the files on port 3000");
});