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
    res.render('index',{errmsg:null})
})
app.post('/register',async(req,res)=>{
    let {username,name,age,email,password}=req.body
    try{
    let user=await User.findOne({email})
    if(user) return res.render('index',{errmsg:"already exist"})

    bcrypt.genSalt(10,(err,salt)=>{
        if(err) {
            return res.render('index',{errmsg:'wrong '})
        }
        bcrypt.hash(password,salt,async(err,data)=>{
            if(err){
                return res.render('index',{errmsg:"wrong password"})
            }
            let user=await User.create({
                username,name,age,email,password:data
            })
            let token=jwt.sign({email:email,userid:user._id},'shh')
            res.cookie('token',token)
            res.redirect('/login')
        })
    })}
    catch(error){
        return res.render('index',{errmsg:'something wrong here.'})
    }
})
app.get('/login',(req,res)=>{
    res.render('login',{errorMessage:null})
})
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).render('login', { errorMessage: 'User not found.' });
        }

        // Compare password
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).render('login', { errorMessage: 'An error occurred while processing your request.' });
            }
                // Generate JWT and set cookie
                const token = jwt.sign({ email: email, userId: user._id }, 'shh');
                res.cookie('token', token);
                return res.redirect('/profile');
            
        });
    } catch (err) {
        console.error(err);
        return res.status(500).render('login', { errorMessage: 'An unexpected error occurred. Please try again.' });
    }
})
app.get('/logout',(req,res)=>{
    res.cookie("token","")
    res.redirect('/login')
})
app.get('/profile', islogged ,async(req,res)=>{

    let user=await User.findOne({email: req.user.email}).populate('posts')

    res.render('profile',{user})
    })


// function islogged(req,res,next){
// if(req.cookies.token === "") return res.send('you must be login')
//     else{
// let data=jwt.verify(req.cookies.token, 'shh')
// req.user=data;
// }
// next();
// }

function islogged(req, res, next) {
    if (!req.cookies.token) return res.redirect('/login');
    jwt.verify(req.cookies.token, 'shh', (err, decoded) => {
       
        if (err) return res.status(401).send('Invalid token');
        //else part
        req.user = decoded;
        next();
    });
}

app.post('/post',islogged,async(req,res)=>{
let user=await User.findOne({email:req.user.email})
let {content}=req.body
let post=await Post.create({
    user:user._id,
    content
})
//user ke post array m push kiya h
user.posts.push(post._id)
await user.save()
res.redirect('/profile')

})
app.get('/like/:id',islogged,async(req,res)=>{
    //populate bcz post field m user ek id ha
    let post =await Post.findOne({_id: req.params.id}).populate("user")
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid)
    }
 else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
 }
    await post.save();
    res.redirect('/profile')

})
app.get('/delete/:id',async(req,res)=>{
 await Post.findByIdAndDelete(req.params.id)
res.redirect('/profile')
})
app.get('/edit/:id',async(req,res)=>{
    let post =await Post.findOne({_id: req.params.id}).populate('user')
    res.render('edit',{post})
})
app.post('/update/:id',async(req,res)=>{
     let post=await Post.findOneAndUpdate({_id: req.params.id},{content: req.body.content})
     res.redirect('/profile')
})
app.listen(PORT,()=>{
    console.log('connect sucessful')
})
