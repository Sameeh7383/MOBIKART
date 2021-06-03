var db = require("../config/connection");
var collections = require("../config/collection");
var bcrypt = require("bcrypt");
var { ObjectId, ObjectID } = require("mongodb");
const { response } = require("express");
const Razorpay=require("razorpay")
const referralCodeGenerator = require('referral-code-generator');
const { link } = require("fs");
const { resolve } = require("path");
const sendmail = require('sendmail')();
var nodemailer = require('nodemailer');
var instance = new Razorpay({
  key_id: 'rzp_test_PAPzu6sjALb3dA',
  key_secret: 'w8ZT3aja8JoSf0AV8drce3pY',
});
module.exports = {
  signup: (data) => {
    return new Promise(async (resolve, reject) => {
      let user= await db.get().collection("user").findOne({email:data.email})
      let verifyPhone=await db.get().collection("user").findOne({phoneNumber:data.phoneNumber})
      data.usedCoupons=[]
      let response={}
      if(user){
        response.email=true
        resolve(response)
      }
      else if(verifyPhone){
        response.phone=true
        resolve(response)

      }
      else{
        if(data.referralOf){
          data.referrals=1
          await db.get()
            .collection("user")
            .updateOne(
              { referralCode: data.referralOf},
              {
                $inc: { "referrals": 1 }
              }
            )
            ;

        }
        else{
          data.referrals=0
        }
      data.password = await bcrypt.hash(data.password, 10);
      data.referralCode=referralCodeGenerator.alphaNumeric('uppercase', 2, 3)+data.firstName
      data.referralLink="http://localhost:3000/signupfrm?referral="+data.referralCode
      
      console.log(data)
      db.get()
        .collection("user")
        .insertOne(data)
        .then((result) => {
          response.user=result.ops[0]
          resolve(response);
        });}
    });},
  verifyLogin:(id)=>{
    return new Promise(async (resolve, reject) => {
      user= await db.get().collection("user").findOne({_id: ObjectId(id) })
      resolve(user)
    })
  },
  login: (loginData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      var user = await db
        .get()
        .collection("user")
        .findOne({ email: loginData.email, status: "Block" });
      if (user) {
        bcrypt.compare(loginData.password, user.password).then((result) => {
          if (result) {
            console.log("login success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      var users = await db.get().collection("user").find().toArray();
      resolve(users);
    });
  },
  deleteuser: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("user")
        .deleteOne({ _id: ObjectId(id) });
      resolve("success");
    });
  },
  userStatus: (id) => {
    return new Promise(async (resolve, reject) => {
      var user = await db
        .get()
        .collection("user")
        .findOne({ _id: ObjectId(id) });
      console.log(user);
      if (user.status == "Block") {
        await db
          .get()
          .collection("user")
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: { status: "Unlock" },
            }
          );
        resolve("success");
      } else {
        await db
          .get()
          .collection("user")
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: { status: "Block" },
            }
          );
        resolve("success");
      }
    });
  },
  adminLogin: (data) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      var user = await db.get().collection("admin").findOne(data);
      resolve(user);
    });
  },
  addToCart: (productId, userId) => {
    let response
    let proObj = {
      item: ObjectId(productId),
      quantity: 1,
    };

    return new Promise(async (resolve, reject) => {
      var cart = await db
        .get()
        .collection("cart")
        .findOne({ user: ObjectId(userId) });
      if (cart) {
        let ProExist = await cart.product.findIndex(
          (product) => product.item == productId
        );
        if (ProExist != -1) {
          // let cartPro=await db.get().collection('cart').findOne({user: ObjectId(userId) , "product.item": ObjectId(productId)})
          let cartProCount=cart.product[ProExist].quantity
          let Pro=await db.get().collection('Products').findOne({_id:ObjectId(productId)})
          if(cartProCount>=Pro.quantity){
            response="noStock"
            resolve(response)
          }
          else{
           db.get()
            .collection("cart")
            .updateOne(
              { user: ObjectId(userId) , "product.item": ObjectId(productId) },
              {
                $inc: { "product.$.quantity": 1 },
              }
            ).then(()=>{
              resolve(response)
            })}
            ;
        } else {
          db.get()
            .collection("cart")
            .updateOne(
              { user: ObjectId(userId) },
              {
                $push: { product: proObj },
              }
            )
            .then(() => {
              resolve(response);
            });
        }
      } else {
        var cartObj = {
          user: ObjectId(userId),
          product: [proObj],
        };
        db.get()
          .collection("cart")
          .insertOne(cartObj)
          .then(() => resolve(response));
      }
    });
  },
  getCartCount: async (userId) => {
    var cart = await db
      .get()
      .collection("cart")
      .findOne({ user: ObjectID(userId) });
    if (cart) {
      var cartCount = cart.product.length;
      return cartCount;
    }
  },getCartProducts: async (userId)=>{
      return new Promise(async(resolve,reject)=>{
          let cartItems= await db.get().collection('cart').aggregate([{
              $match:{ user: ObjectID(userId) }
          },{
            $unwind:'$product'
          },{
            $project:{
              item:'$product.item',
              quantity:'$product.quantity'
            }
          },{$lookup:{
            from:'Products',
            localField:'item',
            foreignField:'_id',
            as:'cartProducts'

          }},{
            $project:{
              item:1,
              CartProducts:{$arrayElemAt:['$cartProducts',0]},
              quantity:1
            }
          }
          
        ]).toArray()
        console.log(cartItems)
        console.log('cartItems')
          resolve(cartItems);

        
       

      })
      // var cart= await db.get().collection("cart").findOne({ user: ObjectID(userId) })
      
  },changeCartQuantity:async (data)=>{
    var count=parseInt (data.count)
    var quantity= parseInt(data.quantity)
    var product=await db.get().collection("Products").findOne({_id:ObjectId(data.product)})

    return new Promise ((resolve,reject)=>{
    if(count==-1&&quantity==1){
    db.get().collection('cart').updateOne({_id: ObjectID(data.cart)},{
        $pull:{product:{item:ObjectID(data.product)}}
      }).then((response)=>{
        resolve({removeProduct:true})
      })
    }
    else if(count==1&&quantity>=product.quantity){
      response.productOver=true
      resolve(response)}
    else{
      db.get()
      .collection("cart")
      .updateOne(
        { _id: ObjectId(data.cart) , "product.item": ObjectId(data.product) },
        {
          $inc: { "product.$.quantity": count },
        }
      )
      .then(() => {
        resolve({status:true});
      });

    }});
  },deleteCartProduct:(data)=>{
    return new Promise ((resolve,reject)=>{
      // console.log(data)
    db.get().collection('cart').updateOne({_id: ObjectID(data.cart)},{
      $pull:{product:{item:ObjectID(data.product)}}
    }).then((response)=>{
      resolve(response)
    })}) 
  },getTotalCost:(userId)=>{
    return new Promise(async(resolve,reject)=>{
      let totalCost= await db.get().collection('cart').aggregate([{
          $match:{ user: ObjectID(userId) }
      },{
        $unwind:'$product'
      },{
        $project:{
          item:'$product.item',
          quantity:'$product.quantity'
        }
      },{$lookup:{
        from:'Products',
        localField:'item',
        foreignField:'_id',
        as:'cartProducts'

      }},{
        $project:{
          item:1,
          CartProducts:{$arrayElemAt:['$cartProducts',0]},
          quantity:1
        }
      },{
        $group:{
          _id:null,
          total:{$sum:{$multiply:['$quantity','$CartProducts.offerPrice']}}
        }
      }
      
    ]).toArray()
      
      // console.log(totalCost)
      resolve(totalCost)
    
    
    
    
    // console.log(totalCost[0].total)
    
  
      

    
   

  })
  },getOrderList:(userId)=>{
    return new Promise (async(resolve,reject)=>{
      let products= await db.get().collection('order').find({ userId: ObjectID(userId) }).sort({date:-1}).toArray()
      resolve(products)
    })
    

  },placeOrder:(order,products,total,user)=>{
    let date=new Date()
    return new Promise (async(resolve,reject)=>
    { 
      console.log(order,products,total)
      let status=order.paymentOption==='COD'?'placed':'pending' 
      let orderdetails={
      address:{
        name:order.firstName,
        number:order.phoneNumber,
        state:order.state,
        street:order.street,
        building:order.building,
        house:order.house,
        zip:order.zip,
        


      },userId:ObjectID(order.userId),
      userName:user.firstName,
      userEmail:user.email,
      userPh:user.phoneNumber,
      paymentMethod:order.paymentOption,
      status:status,
      button:"cancel",
      totalcost:total,
      date:date,
      product:products,

    }
    console.log(order.AddressType)
    console.log(order.userId)
    var userD=order.userId
    if(order.AddressType!="Select Your Address"){
    var address= await db.get().collection('address').findOne({userId:userD,AddressType:order.AddressType})
    console.log(address)
    if(address){
       await db.get().collection('address').updateOne({userId:userD,AddressType:order.AddressType},
      {
        $set:order
      }
      )
    }
    else{
     await db.get().collection('address').insertOne(order)
  }
}
    db.get().collection('order').insertOne(orderdetails).then((result)=>{
      db.get().collection('cart').removeOne({user:ObjectID(order.userId)}).then((response)=>{
        resolve(result.ops[0])
      })
    })
    
    }
    )
  },cancelOrder: (id) => {
    return new Promise(async (resolve, reject) => {
        db
          .get()
          .collection("order")
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: { status: "cancelled",userCancel:true },
            }
          ).then(()=>{
            resolve("success");
          })
       
     
    });
  },profileUpdate: (id,data) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection("user")
        .updateOne({ _id: ObjectId(id) },{ 
          $set:data
        })
        .then(async () => {
          var user=await db.get().collection("user").findOne({ _id: ObjectId(id) })
            console.log(user)
          resolve(user);

          
          
        });
    });},getAddress:(data)=>{
      return new Promise(async (resolve, reject) => {
        console.log(data)
      let address= await db.get().collection("address").findOne(data)
      console.log(address)
      resolve(address)
    })},getAddresses:(data)=>{
      return new Promise(async (resolve, reject) => {
        console.log(data)
        let address= await db.get().collection("address").find({userId:data}).toArray()
        console.log(address)
        resolve(address)

    })},editAddress:(user,data)=>{
      return new Promise(async (resolve, reject) => {
        console.log(user,data)
        
         db.get().collection("address").updateOne({_id:ObjectID(user)},{
          $set:data
        }).then(()=>{
          resolve()
        })
        
        
    })},verifyPhone:(data)=>{
      return new Promise(async (resolve, reject) => {
          db.get().collection("user").findOne(data).then((result)=>{
           resolve(result)
         })
         

         

        }
      )},saveOtp:(number,otp)=>{
        let date=new Date()
        return new Promise(async (resolve, reject) => {
        db.get().collection("otp").insertOne({phoneNumber:number,OTP:otp,date:date}).then(()=>{
          resolve()
        })
        
        })
      },verifyOtp:(data)=>{
        return new Promise(async (resolve, reject) => {
        db.get().collection("otp").findOne(data).then((result)=>{
          resolve(result)
        })
      })},generateRazorpay:(orderId,total)=>{
        console.log(orderId,total)
        return new Promise((resolve,reject)=>{
          var options = {
            amount: (total)*100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: ""+orderId
          };
          instance.orders.create(options, function(err, order) {
            if(err){
            console.log(err)
        }

        else{
            
              console.log("New Order:",order);
            resolve(order)
          }});
        })
      },verifyPayment:(details)=>{
        // console.log(details)
        return new Promise((resolve,reject)=>{
          const crypto=require('crypto')
          let hmac=crypto.createHmac('sha256','w8ZT3aja8JoSf0AV8drce3pY')
          hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
          hmac=hmac.digest('hex')
          if(hmac==details['payment[razorpay_signature]']){
            resolve()
          }
          else{
            reject()
          }
        })
      },changePaymentStatus:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
          await db.get().collection("order").updateOne({_id:ObjectId(orderId)},
          {
            $set:{
              status:"placed"
            }
          }).then(()=>{
            resolve()
          })
        })
      },getBrand:(data)=>{
        return new Promise(async (resolve, reject) => {
          
        let brand= await db.get().collection("category").findOne(data)
      
        console.log(brand)
        resolve(brand)
      })},applyCoupon: (data,id)=>{
        return new Promise(async (resolve, reject) => {
          // console.log(data.coupon)
          db.get().collection('coupons').findOne({"couponCode":data.coupon}).then((coupon)=>{
            var response={}
            // console.log(coupon);
            if(coupon){
              console.log(coupon);
              if(coupon.couponName=="Referral"){
                db.get().collection('user').findOne({_id:ObjectId(id)}).then((user)=>{
                  if(user.referrals==0){
                    response.Nrefer=true
                    resolve(response)
                  }
                  else{
                    let total=parseInt(data.totalCost)
                    let discount=coupon.discount
                    let netAmount=total-(total*(discount/100))
                    response={
                    discount:discount,
                    total:netAmount
                    }
                    resolve(response)
                  }
                })
              }
              else{
                console.log(id,data.coupon)
                db.get().collection("user").findOne({_id:ObjectId(id),usedCoupons:data.coupon}).then((result)=>{
                  console.log(result)
                  if(result){
                    response.used=true
                    resolve(response)
                  }
                  else{
                    let total=parseInt(data.totalCost)
                    let discount=coupon.discount
                    let netAmount=total-(total*(discount/100))
                    response={
                      discount:discount,
                      total:netAmount
                    }
                    resolve(response)
} }) }}
            else{
              response.Nexist=true
              resolve(response)
            }})
          })},useCoupon: (data)=>{
            return new Promise(async (resolve, reject) => {
              // console.log(data.coupon)
              db.get().collection('coupons').findOne({"couponCode":data.coupon}).then((coupon)=>{
                var response={}
                // console.log(coupon);
                if(coupon){
                  console.log(coupon);
                  if(coupon.couponName=="Referral"){
                    db.get().collection('user').findOne({_id:ObjectId(data.id)}).then((user)=>{
                      if(user.referrals==0){
                        response.Nrefer=true
                        resolve(response)
                      }
                      else{
                        db.get().collection('user').updateOne({_id:ObjectId(data.id)},{
                          $inc: { "referrals": -1 }
                        }).then(()=>{
                        let total=parseInt(data.totalCost)
                        let discount=coupon.discount
                        let netAmount=total-(total*(discount/100))
                        response={
                        discount:discount,
                        total:netAmount
                        }
                        resolve(response)
                      })
                      }
                    })
                  }
                else{
                    console.log(data.id,data.coupon)
                    db.get().collection("user").findOne({_id:ObjectId(data.id),usedCoupons:data.coupon}).then((result)=>{
                      console.log(result)
                      if(result){
                        response.used=true
                        resolve(response)
                      }
                      else{
                        db.get().collection('user').updateOne({_id:ObjectId(data.id)},{
                          $push:{usedCoupons:data.coupon}

                        })
                        let total=parseInt(data.totalCost)
                        let discount=coupon.discount
                        let netAmount=total-(total*(discount/100))
                        response={
                          discount:discount,
                          total:netAmount
                        }
                        resolve(response)
    } }) }}
                else{
                  response.Nexist=true
                  resolve(response)
                }})
              })},forgotPwd:(email)=>{
                return new Promise(async (resolve, reject) => {
                  var response={}
                db.get().collection('user').findOne(email).then((user)=>{
                  if(user){
                    let token=referralCodeGenerator.alphaNumeric('uppercase', 4, 9)
                    var link="http://localhost:3000/resetPwdFrm?token="+token
                    db.get().collection('reset').insertOne({userId:ObjectID(user._id),token:token,date:new Date()}).then(()=>{
                      var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                          user: "smartcoder1258@gmail.com",
                          pass: "smartcoder@99"
                        }
                      });
                      
                      var mailOptions = {
                        from: 'smartcoder1258@gmail.com',
                        to: user.email,
                        subject: 'Password Reset',
                        text: 'YOUR PASSWORD RESET KEY FOR MOBIKART IS:'+link
                      };
                      
                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          response.error=true
                        } else {
                          response.success=true
                          resolve(response)
                          console.log('Email sent: ' + info.response);
                        }
                      });
                    })

                  }else{
                    response.exist=true
                    resolve(response)
                  }

                })
               }) },tokenCheck:(token)=>{
                 return new Promise((resolve,reject)=>{
                  db.get().collection("reset").findOne(token).then((result)=>{
                    resolve(result)})
                })
              },resetPwd:(pwd,id)=>{
                return new Promise (async (resolve,reject)=>{
                pwd=await bcrypt.hash(pwd, 10);
                console.log(pwd)
                db.get().collection('user').updateOne({_id:ObjectID(id)},{
                  $set:{password:pwd}
                }).then(()=>{
                  resolve()
                })
              }) },googleSignin:(user,referral)=>{
                let email=user.emails[0].value
                console.log(email)
                return new Promise (async (resolve,reject)=>{
                  var result=await db.get().collection('user').findOne({email:email,GID:user.id})
                  if(result){
                    console.log(result)
                    resolve(result)
                  }
              else{
                var data=await db.get().collection('user').findOne({email:email})
                if(data){
              
                  db.get().collection('user').updateOne({email:email},{
                    $set:{GID:user.id}
                  }).then(()=>{
                    console.log(data)
                    resolve(data)
                  })}


              else{
                  var referralCode=referralCodeGenerator.alphaNumeric('uppercase', 2, 3)+user.name.givenName
                  var referralLink="http://localhost:3000/signupfrm?referral="+referralCode
                  var referrals=0
                  if(referral){
                    referrals=1
                    await db.get()
                      .collection("user")
                      .updateOne(
                        { referralCode: referral},
                        {
                          $inc: { "referrals": 1 }
                        }
                      )
                      ;
          
                  }
                  db.get().collection("user").insertOne({
                    email:email,
                    GID:user.id,
                    firstName:user.name.givenName,
                    lastName:user.name.familyName,
                    usedCoupons:[],
                    referralOf:referral,
                    referrals:referrals,
                    referralCode:referralCode,
                    referralLink:referralLink,
                    status:"Block"
                  }).then((result)=>{
                    resolve(result.ops[0])
                  })}
                }})},facebookLogin:(data,referral)=>{
                    let facebookID=data.user.id
                    let name=data.user.displayName.split(/(\s+)/);
                    let firstName=name[0]
                    let lastName=name[2]
                    // console.log(name,name[0],name[2])
                    // console.log(email)
                    return new Promise (async (resolve,reject)=>{
                      var result=await db.get().collection('user').findOne({FID:facebookID})
                      if(result){
                        console.log("ok")
                        resolve(result)
                      }
                  else{
                      var referralCode=referralCodeGenerator.alphaNumeric('uppercase', 2, 3)+firstName
                      var referralLink="http://localhost:3000/signupfrm?referral="+referralCode
                      var referrals=0
                      if(referral){
                        referrals=1
                        await db.get()
                          .collection("user")
                          .updateOne(
                            { referralCode: referral},
                            {
                              $inc: { "referrals": 1 }
                            }
                          )
                          ;
              
                      }
                      db.get().collection("user").insertOne({
                        email:"",
                        GID:"",
                        FID:facebookID,
                        firstName:firstName,
                        lastName:lastName,
                        usedCoupons:[],
                        referralOf:referral,
                        referrals:referrals,
                        referralCode:referralCode,
                        referralLink:referralLink,
                        status:"Block"
                      }).then((result)=>{
                        resolve(result.ops[0])
                      })}
                    // }})
    
                })}


              

               
    
};
