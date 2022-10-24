//jshint esversion:6
require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser");
const mongoose = require("mongoose")

const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")


const bcrypt = require("bcrypt")
const saltRounds=10


const app = express()

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("public"))

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  }))

app.use(passport.initialize())
app.use(passport.session())


mongoose.connect('mongodb://localhost:27017/userDB');



const userSchema =new mongoose.Schema ({
    email: String,
    password: String,
    secret: String
})

//intializing mongoose with passport packages for security ans sessions
userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User",userSchema)

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.get("/",function(req,res){
    res.render("home")
})


app.get("/login",function(req,res){
    res.render("login")
})
app.get("/register",function(req,res){
    res.render("register")
})
app.get("/secrets",function(req,res){

    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                console.log(foundUsers);
                res.render("secrets", {usersWithSecrets:foundUsers} )
            }else{
                console.log("no found users");
            }
        }
    })
})
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
})



app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { 
            console.log(err); 
        }
        res.redirect('/');
      });
})


app.post("/login",function(req,res){
//passport passport-local-mongoose express-session login way

    const user = new User({
        username:req.body.username,
        password:req.body.password
    })

    req.logIn(user,function(err){
        if(err){
            console.log(err)
        }else{
            //save cookie in localstorage with authentication
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })




//bcrypt way of login
/*     const email= req.body.username
    User.findOne({email:email},function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                    if(result==true){
                        res.render("secrets")
                    }
                });
            }else{
                console.log("no foundUser")
            }
        }
    }) */
})





app.post("/register",function(req,res){
//passport passport-local-mongoose session security 

    User.register({username:req.body.username, active: false}, req.body.password, function(err, user){
        if(!err){
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })
        }

    })

    // bcrypt security
/*     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(!err){
            const newUser = new User({
                email:req.body.username,
                password:hash
            })
            newUser.save(function(err){
                if(!err){
                    console.log("new user added")
                    res.render("secrets")
                }else{
                    console.log(err)
                }
            })
        }else{
            console.log(err)
        }

    }); */
})


app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret
    console.log(req.user)
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret=submittedSecret
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
})




app.listen(3000, function () {
    console.log("server on local host 3000")
})