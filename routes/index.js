var express = require("express");
var router = express.Router();
const productHelpers = require("../helpers/productHelpers");
const { verifyLogin } = require("../helpers/userHelpers");
const userHelpers = require("../helpers/userHelpers");
require("dotenv").config();
const fast2sms = require("fast-two-sms");
var otpGenerator = require("otp-generator");
var paypal = require('paypal-rest-sdk');
const fs=require('fs');
const { resolve } = require("path");
const { Console, log } = require("console");
const { Strategy } = require('passport-facebook');
// const getCount=async (req,res,next)=>{
//   if(req.session.user){
//     var data = req.session.user;
//     cartCount = await userHelpers.getCartCount(data._id);
//     return cartCount
//     next()
//   }
//   else{
//     next()
//   }
// }

// PASSPORT SETTING FOR GOOGLE AUTHENTICATION

const passport = require('passport');
var userProfile;
router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const { Router } = require("express");
const { session } = require("passport");
const GOOGLE_CLIENT_ID = '463422158261-gs8pqjrrb12f5av02jn0tkk6oj11gvdl.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '1rq1aTBe34_ipeGcZIGM6Zxc';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.mobikart.store/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
));
// PASSPORT SETTING FOR FACEBOOK AUTHENTICATION
passport.use(new Strategy({
  clientID: "770416073618462",
  clientSecret: "546ff28a7caf97549782f8c6bc38026f",
  callbackURL: '/facebookCallback'
},
(accessToken, refreshToken, profile, cb) => {
  return cb(null, profile);
}));


// PAY PAL SETTING

// var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AR83Zj2wTHCDHHlhZDHAeg_eEdliHt0FCxm8ejwIPTvIndoN4FpOdZxySsfKod1nzlLiO5pO5LlZf4Mu',
  'client_secret': 'EFZVH7jTcWjhgXDmr4k3tvQKAwpmUu0HVRIS3sbfBLJQieqzPL7BOcuEQ92ZHlrI9wVC--idv3cYs-Bq'
});


const loginVerify = async (req, res, next) => {
  if (req.session.loggedin) {
    var user = req.session.user._id;
    var verifyLogin = await userHelpers.verifyLogin(user);

    console.log(verifyLogin.status);

    if (verifyLogin.status == "Block") {
      console.log(verifyLogin.status);

      next();
    } else {
      res.redirect("/loginfrm");
    }
  } else {
    res.redirect("/loginfrm");
  }
};

// ROUTES

/* GET home page. */

router.get("/", async function (req, res, next) {
  if (req.session.loggedin) {
    var data = req.session.user;
    console.log(data);
    cartCount = await userHelpers.getCartCount(data._id);
    productHelpers.getOfferProducts().then((Products) => {
      req.session.cartCount = cartCount;

      res.render("index", { Products: Products, data, cartCount });
      res.header(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );
    });
  } else {
    productHelpers.getOfferProducts().then((Products) => {
      
      res.render("index", { Products: Products });
    });
  }
});


// GET PRODUCT LIST


router.get('/productList',async (req,res)=>{

  var page,urlPrev,urlNext,pageOver,pageStart
  if(!req.query.pg){
    page=1
    urlNext= req.originalUrl+'&pg='+(page+1)
  }
  else{
  page=parseInt(req.query.pg)
 // console.log(page)
urlNext=req.originalUrl.substring(0,req.originalUrl.lastIndexOf('=')+1)+(page+1)
urlPrev=req.originalUrl.substring(0,req.originalUrl.lastIndexOf('=')+1)+(page-1)
 delete req.query.pg
  }
  // console.log(req.query)
// 
  // console.log(urlNext,urlPrev,page)
  let categories=await productHelpers.getCategories()
  let products= await productHelpers.getProductList(page,req.query)
  let productList=products[0]
if(page>=products[1]){
    pageOver=true
  }
if(page==1){
    pageStart=true}
if(page==1&&page>=products[1]){
pageOver=true
pageStart=true
}
  res.render('product-list',{ productList,data:req.session.user,pageStart,pageOver,urlNext,urlPrev,categories,cartCount:req.session.cartCount })

})



// ROUTE FOR LOGIN PAGE

router.get("/loginfrm", async function (req, res, next) {
 
  res.render("login", {
    logginerr: req.session.logginerr,
    askLogin: req.session.askLogin,
    reset:req.session.reset
  });
  req.session.logginerr=false
  req.session.reset=false
});

//ROUTE FOR LOGIN ACTION

router.post("/login", function (req, res, next) {
  console.log(req.body);
  userHelpers.login(req.body).then((result) => {
    if (result.status) {
      req.session.loggedin = true;
      req.session.user = result.user;

      res.redirect("/");
    } else {
      req.session.logginerr = true;
      res.redirect("/loginfrm");
    }
  });
});
// ROUTE TO FORGOT PASSWORD FORM
router.get('/forgotPwdFrm',(req,res)=>{
  res.render('forgot-password')
})
// ROUTE TO FORGOT PASSWORD ACTION
router.post('/forgotPwd',(req,res)=>{
  userHelpers.forgotPwd(req.body).then((result)=>{
    res.json(result)

  })
})

// ROUTE TO RESET PASSWORD FORM
router.get('/resetPwdFrm',(req,res)=>{
userHelpers.tokenCheck(req.query).then((result)=>{
res.render('reset-password',{result})
})
})

// ROUTE TO RESET PASSWORD ACTION

router.post('/resetPwd/:id',(req,res)=>{
userHelpers.resetPwd(req.body.password,req.params.id).then(()=>{
req.session.reset=true
res.redirect('/loginfrm')
})
})

//ROUTE FOR SIGNUP PAGE

router.get("/signupfrm", function (req, res, next) {
  if(req.query){
  req.session.referral=req.query.referral}
  res.render("signup", {
    referral:req.session.referral,
    emailErr: req.session.emailErr,
    phoneErr: req.session.phoneErr,
  });
  req.session.emailErr = false;
  req.session.phoneErr = false;
});

//ROUTE FOR SIGNUP ACTION

router.post("/signup", function (req, res, next) {
  userHelpers.signup(req.body).then((result) => {
    if (result.email == true) {
      req.session.emailErr = true;
      res.redirect("/signupfrm");
    } else if (result.phone == true) {
      req.session.phoneErr = true;
      res.redirect("/signupfrm");
    } else {

      req.session.user = result.user;
      req.session.loggedin = true;
      res.redirect("/");
    }
    // console.log(result)
  });
});
// ROUTE FOR USER LOGOUT

router.get("/logout", function (req, res, next) {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  req.session.loggedin = false;
  req.session.destroy();
  res.redirect("/");
});

// ROUTE TO PRODUCT DETAILS

router.get("/productdetails1/:id", function (req, res, next) {
  productHelpers.getProduct(req.params.id).then((product) => {
    req.session.pro = product;
    res.redirect("/productdetails");
  });
});

router.get("/productdetails", async function (req, res, next) {
  var product = req.session.pro;

  console.log(product);
  var data = req.session.user;
  if (data) {
    var cartCount = await userHelpers.getCartCount(data._id);
  }
  res.render("product-detail", { product, data, cartCount });
});

// ROUTE TO CART
router.get("/cart", loginVerify, async (req, res) => {
  let cartProducts = await userHelpers.getCartProducts(req.session.user._id);
  if (cartProducts.length == 0) {
    var cartEmpty = true;
    res.render("cart", {
      data: req.session.user._id,
      cartProducts,
      cartCount: req.session.cartCount,
      cartEmpty,
    });
  } else {
    let totalCost = await userHelpers.getTotalCost(req.session.user._id);
    //  console.log(cartProducts)
    totalCost = totalCost[0].total;

    res.render("cart", {
      data: req.session.user._id,
      cartProducts,
      cartCount: req.session.cartCount,
      totalCost,
    });
  }
});

// ROUTE TO THE ACTION ADD TO CART
router.get("/add-to-cart/:id", (req, res) => {
  userHelpers.addToCart(req.params.id, req.session.user._id).then((result) => {
    if(result=="noStock"){
      res.json({status:false})
    }
    else{
    // console.log("ajax success");
    res.json({ status: true });}
  });

  // res.redirect('/')
});
//  ROUTE TO CHANGE PRODUCT QUANTITY

router.post("/change-cart-quantity", (req, res) => {
  console.log(req.body);
  userHelpers.changeCartQuantity(req.body).then(async (response) => {
    if(response.removeProduct){
      res.json(response);
    }
    else if(response.productOver){
      res.json(response)}
    else{
    var total = await userHelpers.getTotalCost(req.body.user);
    response.total = total[0].total;
    console.log(response);
    res.json(response);}
  });
});

// ROUTE TO DELETE PRODUCT FROM THE CART

router.post("/delete-cart-quantity", (req, res) => {
  console.log(req.body);
  userHelpers.deleteCartProduct(req.body).then((response) => {
    res.json(response);
  });
});

// ROUTE TO THE CHECKOUT PAGE
router.get("/checkout", loginVerify, async (req, res) => {
  let cartProducts = await userHelpers.getCartProducts(req.session.user._id);
  let totalCost = await userHelpers.getTotalCost(req.session.user._id);
  totalCost = totalCost[0].total;

  res.render("checkout", {
    cartProducts,
    data: req.session.user,
    cartCount: req.session.cartCount,
    totalCost,
  });
});

//  ROUTE FOR PLACE ORDER

router.post("/place-order", loginVerify, async (req, res) => {
  console.log(req.body);
  let products = await userHelpers.getCartProducts(req.body.userId);
  req.session.cartPro=products
  let totalPrice = await userHelpers.getTotalCost(req.body.userId);
  totalPrice=totalPrice[0].total
  console.log(req.body.coupon)
   if(req.body.coupon){
    let data={
      coupon:req.body.coupon,
      totalCost:totalPrice,
      id:req.session.user._id
}
userHelpers.useCoupon(data).then((response)=>{
if(response.discount){
req.body.couponDiscount=response.discount
totalPrice=response.total
}
})
  }

 // console.log(products,totalPrice) 
  userHelpers
    .placeOrder(req.body, products, totalPrice, req.session.user)
    .then((order) => {
      req.session.orderDetails=order
      if(req.body["paymentOption"]=='COD'){
        res.json({codSuccess:true})
      }
      else if(req.body["paymentOption"]=='razorpay'){
        userHelpers.generateRazorpay(order._id,totalPrice).then((response)=>{
          res.json({rzpSuccess:true,payment:response})

        })
      }
      else if(req.body["paymentOption"]=='Paypal'){
        const create_payment_json = {
          "intent": "sale",
          "payer": {
              "payment_method": "paypal"
          },
          "redirect_urls": {
              "return_url": "http://www.mobikart.store/success",
              "cancel_url": "http://www.mobikart.store/cancel"
          },
          "transactions": [{
              "item_list": {
                  "items": [{
                      "name": "",
                      "sku": "001",
                      "price": totalPrice,
                      "currency": "USD",
                      "quantity": 1
                  }]
              },
              "amount": {
                  "currency": "USD",
                  "total": totalPrice
              },
              "description": ""
          }]
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i = 0;i < payment.links.length;i++){
              if(payment.links[i].rel === 'approval_url'){
                res.json({pyplSuccess:true,paypalLink:payment.links[i].href})
              }
            }} });}   
req.session.cost=totalPrice
req.session.order=order._id
   
    });
   
});


// ROUTE IF THE PAYPAL PAYMENT IS SUCCESS

router.get('/success',async (req, res) => {


  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": req.session.cost
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        userHelpers.changePaymentStatus(req.session.order).then(()=>{
          res.redirect("/orderSuccess")})
    }
});
});

// ROUTE IF THE PAYPAL PAYMENT IS CANCELLED


router.get('/cancel',(req,res)=>{
res.redirect('/orderDetails')
})

// ROUTE TO ORDER SUCCESS PAGE
router.get("/orderSuccess", loginVerify, async function (req, res, next) {
// console.log(req.session.cartPro)
await productHelpers.decProQty(req.session.cartPro)
res.render("order-placed", { data: req.session.user });
req.session.cartPro=false
});
// ROUTE FOR USER PROFILE
router.get("/userProfile", loginVerify, function (req, res, next) {
  if(req.session.user.referrals!=0){
    var coupon=true
  }
  res.render("user-profile2", { data: req.session.user ,coupon});
});

// ROUTE TO ADD CROPPED IMAGE AS PROFILE PICTURE
router.post("/propicUpload",(req,res)=>{
  const path=('./public/images/'+req.session.user._id+'.png')
  const img=req.body.image;
  const base64Data=img.replace(/^data:([A-Za-z-+/]+);base64,/, '');
  fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
  res.json(base64Data)
  
 
})

// ROUTE FOR ORDER DETAILS
router.get("/orderDetails", loginVerify, async function (req, res, next) {
  let orderDetails = await userHelpers.getOrderList(req.session.user._id);
  console.log(orderDetails);
  res.render("order-details", { data: req.session.user, orderDetails });
});
// TO CANCEL ORDER FROM USER
router.get("/cancelOrder/:id",(req, res) => {
  console.log(req.params.id)
userHelpers.cancelOrder(req.params.id).then(() => {
  res.redirect("/orderDetails");
  });
});
// ROUTE TO EDIT USER PROFILE FORM
router.get("/editProfileFrm", loginVerify, function (req, res, next) {
  res.render("edit-profile", { data: req.session.user });
});
// ROUTE TO EDIT USER ACTION
router.post("/editProfile", loginVerify, async (req, res) => {
  await userHelpers
    .profileUpdate(req.session.user._id, req.body)
    .then((result) => {
      req.session.user = result;
      res.redirect("/userprofile");
    });
});
// ROUTE TO ADDRESS MANAGEMENT
router.get("/addressView", function (req, res, next) {
  userHelpers.getAddresses(req.session.user._id).then((result) => {
    res.render("addresses", { data: req.session.user, result });
  });
});


// ROUTE TO GET  ADDRESS IN AJAX


router.post("/getAddress", function (req, res, next) {
  userHelpers.getAddress(req.body).then((response) => {
    // console.log(response)
    let obj = response;
    res.json(obj);
  });
  // res.render('addresses',{"data":req.session.user});
});

// ROUTE TO EDIT ADDRESS
router.get("/editAddressFrm/:ad", loginVerify, function (req, res, next) {
  let obj = {
    userId: req.session.user._id,
    AddressType: req.params.ad,
  };
  console.log(obj);
  userHelpers.getAddress(obj).then((result) => {
    res.render("edit-address", {
      data: req.session.user,
      result,
      layout: "layoutId",
    });
  });
});


// ROUTE TO EDIT ADDRESS ACTION


router.post("/editAddress/:id", loginVerify, function (req, res, next) {
  userHelpers.editAddress(req.params.id, req.body).then(() => {
    res.redirect("/addressView");
  });
});
// ROUTE TO OTP LOGIN FOR ENTER THE NUMBER

router.get("/otpNum", function (req, res, next) {
  res.render("otp-number", { phoneExist:req.session.phoneExist });
  req.session.phoneExist=false
});

router.get("/otpLoginFrm1",(req,res)=>{
  res.render("otp-key", { number:req.session.number,otpErr:req.session.otpErr});
  req.session.otpErr=false
})

// ROUTE TO ENTER OTP FORM

router.post("/otpLoginFrm", async (req, res, next) => {
  await userHelpers.verifyPhone(req.body).then(async (result) => {
    if (result) {
      var otp = otpGenerator.generate(6, {
        specialChars: false,
        alphabets: false,
        upperCase: false,
      });
     console.log(otp)
      let number = req.body.phoneNumber;
      req.session.number=number
      userHelpers.saveOtp(number,otp).then(async ()=>{
      let YOUR_API_KEY =
        "Cte1lkvc6SzaibQfnjPqYI7H5AhBdFMEp3ONgmrWVo2L8J4Rwswt5oaXJk82ETPUYm9Iz7fhZcn4BOge";
      let options = {
        authorization: YOUR_API_KEY,
        message: otp,
        numbers: [number],
      };
      fast2sms.sendMessage(options); //Asynchronous Function.
      res.redirect("/otpLoginFrm1")})
    } else {
      req.session.phoneExist = true;
      res.redirect("/otpNum")
    }
  });
});


// ROUTE OF OTP LOGIN ACTION

router.post("/otpLogin",async(req,res)=>{
  let otp=await userHelpers.verifyOtp(req.body)
  if(otp){
let user=await userHelpers.verifyPhone({phoneNumber:req.body.phoneNumber})
req.session.user=user
req.session.loggedin=true
res.redirect("/")
  }
  else{
req.session.otpErr=true
res.redirect("/otpLoginFrm1")
  }
})

// ROUTE TO VERIFY PAYMENT

router.post('/verifyPayment',(req,res)=>{
userHelpers.verifyPayment(req.body).then(()=>{
  console.log(req.body)
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    console.log('payment successfull')
    res.json({status:true})
  })
}).catch((err)=>{
  res.json({status:false,errmsg:''})
})
})


//  ROUTE TO APPLY COUPON
router.post('/applyCoupon',(req,res)=>{
  console.log(req.body);
  userHelpers.applyCoupon(req.body,req.session.user._id).then((result)=>{
    console.log(result)
    res.json(result)

  })
})
// ROUTE TO PRINT INVOICE 
router.get('/invoice',(req,res)=>{
  let COD
let order=req.session.orderDetails
if(order.paymentMethod=="COD"){
 COD=true
}
res.render("print-invoice",{order,COD})
})

// SIGN IN WITH GOOGLE BUTTON ACTION
router.get('/auth/google', 

  passport.authenticate('google', { scope : ['profile', 'email'] }));

// CALLBACK URL FOR GOOGLE AUTHENTICATION
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/googleError' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/googleSuccess');
  });

// REDIRECT ROUTE WHEN GOOGLE AUTHENTICATION SUCCESS

  router.get('/googleSuccess', (req, res) =>{
    // res.send(userProfile)
    console.log(userProfile)
    userHelpers.googleSignin(userProfile,req.session.referral).then((user)=>{
      if(user.status== "Unlock"){
        res.redirect('/')
      }
      else{
    req.session.user=user
    console.log(user)
    req.session.loggedin=true
res.redirect('/')
}

    })


  } )

//REDIRECT ROUTE WHEN GOOGLE AUTHENTICATION FAILURE 

  router.get('/googleError', (req, res) => res.send("error logging in"));

// SIGN IN WITH FACEBOOK BUTTON ACTION
router.get('/login/facebook', passport.authenticate('facebook'));

// IF FACEBOOK LOGIN SUCCESS
router.get('/facebook/auth', (req, res, next) => {
  // res.send({user})
  const { user } = req;
  var sam={user}
  // console.log(sam)
  userHelpers.facebookLogin(sam,req.session.referral).then((user)=>{
    if(user.status== "Unlock"){
      res.redirect('/')
    }
else{
    req.session.loggedin=true
    req.session.user=user
    console.log(req.session.user)
    res.redirect('/')}

  })
  // res.render('home', { user });
});
router.get('/facebookCallback', 
  passport.authenticate('facebook', { failureRedirect: '/facebookFailed' }),
  (req, res, next) => {
    // res.send("fb login failed")
    res.redirect('/facebook/auth');
});

// IF FACEBOOK LOGIN FAILED
router.get('/facebookFailed',((req,res)=>{
  res.send("Login failed")
}))

module.exports = router;
