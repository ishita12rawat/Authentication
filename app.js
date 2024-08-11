const express=require('express')


const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const User= require('./models/user')
const Post=require('./models/post')
const cookieParser=require('cookie-parser')
const PORT=4090
const app=express()
app.set("view engine","ejs")
app.use(express.json())
// const Post =require('./models/post')
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(cookieParser())
app.get('/',(req,res)=>{
    res.render('index')
})
app.post('/register',async(req,res)=>{
    let {username,name,age,email,password}=req.body
    let user=await User.findOne({email})
    if(user) return res.status(500).send('user already exist')



    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async(err,data)=>{
            let user=await User.create({
                username,name,age,email,password:data
            })
            let token=jwt.sign({email:email,userid:user._id},'shh')
            res.cookie('token',token)
            res.send("resigeted")
        })
    })
})
app.get('/login',(req,res)=>{
    res.render('login')
})
app.post('/login',async(req,res)=>{
    let {email,password}=req.body;
    let user=await User.findOne({email})
    if(!user) return res.status(500).send('some things is wrong')
 
bcrypt.compare(password,user.password,(err,result)=>{
    if(result) 
        {
            let token=jwt.sign({email:email,userid:user._id},'shh')
            res.cookie('token',token)
            res.redirect('/profile')
            
        }
else{
res.redirect('/login')   }     
})
    
})
app.get('/logout',(req,res)=>{
    res.cookie('token',"")
    res.redirect('/login')
})
function islogged(req,res,next){
if(req.cookies.token === "") res.send('you must be login')
    else{
let data=jwt.verify(req.cookies.token, 'shh')
req.user=data;
}

next()
}
app.get('/profile', islogged,async(req,res)=>{
let user=await User.findOne({email: req.user.email}).populate('posts')

res.render('profile',{user})
})
app.post('/post',islogged,async(req,res)=>{
let user=await User.findOne({email:req.user.email})
let {content}=req.body
let post=await Post.create({
    user:user._id,
    content
})
user.posts.push(post._id)
await user.save()
res.redirect('/profile')

})
app.get('/like/:id',async(req,res)=>{
    let Post =await User.findOne({_id: req.params.id}).populate('user')
    Post.likes.push(req.User.userid)
    console.log(req.User.id)
    // res.render('profile',{user})

})
app.listen(PORT,()=>{
    console.log('connect sucessful')
})
