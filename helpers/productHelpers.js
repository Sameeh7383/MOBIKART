var db = require("../config/connection");
var collections = require("../config/collection");

var { ObjectId, ObjectID } = require("mongodb");
const { response } = require("express");
module.exports = {
  addProduct: (product, callback) => {
    product.offerPrice = parseInt(product.offerPrice);
    product.quantity=parseInt(product.quantity)
    db.get()
      .collection(collections.product)
      .insertOne(product)
      .then((data) => {
        console.log(data);
        callback(data.ops[0]._id);
      });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      db.get().collection("Products").find().forEach(element => {
        if (element.offerPrice!=element.price){
          db.get().collection('Products').updateOne({_id:element._id},{$set:{OnOffer:true}})
        }
        else{
         
          db.get().collection('Products').updateOne({_id:element._id},{$set:{OnOffer:false}})
        }

      }).then(async ()=>{
        var Products = await db
        .get()
        .collection(collections.product)
        .find()
        .toArray();
        resolve(Products);
      })
     
      
    });
  },
  deleteProduct: (id) => {
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.product)
        .deleteOne({ _id: ObjectId(id) });
      resolve("success");
    });
  },
  getProduct: (id) => {
    return new Promise(async (resolve, reject) => {
      var Product = await db
        .get()
        .collection(collections.product)
        .findOne({ _id: ObjectId(id) });
      resolve(Product);
    });
  },
  editProduct: (user, id) => {
    user.offerPrice = parseInt(user.offerPrice);
    user.quantity=parseInt(user.quantity)
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collections.product)
        .updateOne(
          { _id: ObjectId(id) },
          {
            $set: user,
          }
        );
      resolve("done");
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db.get().collection("order").find().toArray();
      resolve(orders);
    });
  },
  cancelOrder: (id) => {
    return new Promise(async (resolve, reject) => {
      var order = await db
        .get()
        .collection("order")
        .findOne({ _id: ObjectId(id) });

      if (order.status == "placed") {
        await db
          .get()
          .collection("order")
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: { status: "cancelled", button: "approve" },
            }
          );
        resolve("success");
      } else {
        await db
          .get()
          .collection("order")
          .updateOne(
            { _id: ObjectId(id) },
            {
              $set: { status: "placed", button: "cancel" },
            }
          );
        resolve("success");
      }
    });
  },
  addCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      var category = await db.get().collection("category").findOne(data);
      if (category) {
        reject();
      } else {
        db.get()
          .collection("category")
          .insertOne(data)
          .then((result) => {
            resolve(result);
          });
      }
    });
  },
  addBrand: (data) => {
    var Brand = data.brand;
    var id = data.id;
    console.log(Brand);
    console.log(id);
    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("category")
        .updateOne(
          { _id: ObjectId(id) },
          {
            $push: { brand: Brand },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getCategories: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await db.get().collection("category").find().toArray();
      // console.log(categories)
      resolve(categories);
    });
  },
  deleteCategory: (id) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection("category")
        .deleteOne({ _id: ObjectId(id) })
        .then((result) => {
          resolve(result);
        });
    });
  },
  getCategory: (id) => {
    return new Promise(async (resolve, reject) => {
      let category = await db
        .get()
        .collection("category")
        .findOne({ _id: ObjectId(id) });
      // console.log(categories)
      resolve(category);
    });
  },
  removeBrand: (data) => {
    id = data.id;
    Brand = data.brand;

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection("category")
        .updateOne(
          { _id: ObjectId(id) },
          {
            $pull: { brand: Brand },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getSaleProducts: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection("order")
        .find({ status: "placed" })
        .toArray();
      resolve(orders);
    });
  },
  salesSearch: (start, end) => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection("order")
        .find({ date: { $gte: start, $lt: end }, status: "placed" })
        .toArray();
      resolve(result);
    });
  },
  getProductList: (page,filter) => {
    console.log(filter)
    return new Promise(async (resolve, reject) => {
      var limit = 9;
      var skip = (page - 1) * limit;
      if(filter.search){
        let Products = await db
        .get()
        .collection("Products")
        .find({productName:{$regex:filter.search,$options:"$i"}})
        .toArray();

      let pageCount = Math.round(Products.length / limit);
      // console.log(pageCount)
      let ProductList = await db
        .get()
        .collection('Products')
        .find({productName:{$regex:filter.search,$options:"$i"}})
        .limit(limit)
        .skip(skip)
        .toArray();
      resolve([ProductList, pageCount]);
      }
      else{
 let Products = await db
        .get()
        .collection("Products")
        .find(filter)
        .toArray();

      let pageCount = await Math.round(Products.length / limit);
      // console.log(pageCount)
      let ProductList = await db
        .get()
        .collection('Products')
        .find(filter)
        .limit(limit)
        .skip(skip)
        .toArray();
      resolve([ProductList, pageCount]);
      }
     
    });
  },
  getFilterResults: (day) => {
    return new Promise(async (resolve, reject) => {
      let result = await db
        .get()
        .collection("order")
        .find({
          date: {
            $gte: new Date(new Date().getTime() - day * 24 * 60 * 60 * 1000),
          },
          status: "placed",
        })
        .sort({ date: -1 })
        .toArray();
      console.log(result);
      resolve(result);
    });
  },
  getTodaySale: () => {
    return new Promise(async (resolve, reject) => {
      var date=new Date()
      date.setHours(0,0,0,0)
      result = await db
        .get()
        .collection("order")
        .find({ date: { $gte: date } })
        .toArray();
      console.log("success");
      resolve(result);
    });
  },
  getTotalSale: () => {
    return new Promise(async (resolve, reject) => {
      let month = new Date();
      result = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: {
              date: { $gte: new Date(`${month.getMonth()}`) },
              status: "placed",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              totalcost: { $sum: "$totalcost" },
            },
          },
        ])
        .toArray();
      console.log(result);
      resolve(result);
    });
  },
  getUsersCount: () => {
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection("user").find().toArray();
      resolve(user);
    });
  },
  getProductsCount: () => {
    return new Promise(async (resolve, reject) => {
      let count = await db.get().collection("Products").find().toArray();
      resolve(count);
    });
  },
  getYearlyReport: () => {
    return new Promise(async (resolve, reject) => {
      let graphData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      let year = new Date();
      result = await db
        .get()
        .collection("order")
        .aggregate([
          {
            $match: {
              date: { $gte: new Date(`${year.getFullYear()}`) },
              status: "placed",
            },
          },
          {
            $group: {
              _id: { $month: "$date" },
              total: { $sum: 1 },
              totalcost: { $sum: "$totalcost" },
            },
          },
        ])
        .toArray();
      for (let i = 0; i < result.length; i++) {
        graphData[result[i]._id - 1] = result[i].totalcost;
      }
      // console.log(graphData)
      resolve(graphData);
    });
  },addCoupon:(data)=>{
    return new Promise(async (resolve, reject) => {
var exist=await db.get().collection('coupons').findOne({couponName:data.couponName})
console.log(exist)
if(exist){
 response.exist=exist
 resolve(response)
}
else{
  data.discount=parseInt(data.discount)
  data.validity= new Date(data.validity)
db.get().collection('coupons').insertOne(data).then(()=>{
  response.success="ok"
resolve(response)
})}
})
},getAllCoupons:()=>{
  return new Promise(async (resolve, reject) => {
    db.get().collection("coupons").find().toArray().then((result)=>{
      resolve(result);
    })
    
  });
},deleteCoupon:(id)=>{
  return new Promise(async (resolve, reject) => {
    db.get().collection("coupons").removeOne({ _id: ObjectId(id) }).then(()=>{
      resolve();
    })})
},addCoffers:(data)=>{
  let discount=parseInt(data.discount)
  return new Promise((resolve,reject)=>{
    let response={}
    console.log(data.category)
    db.get().collection('categoryOffers').findOne({category:data.category}).then((offer)=>{
      if(offer){
      response.exist=true
      resolve(response)
      }
      else{
        
          db.get().collection("Products").find({category:data.category}).forEach(element => {
            element.price=parseInt(element.price)
            let offerPrice=element.price-(element.price*(discount/100))
            console.log(element.offerPrice)
            db.get().collection('Products').updateOne({_id:element._id},{$set:{offerPrice:offerPrice,catOffer:true}})
          },).then(()=>{
            db.get().collection('categoryOffers').insertOne(data).then(()=>{
              response.success=true
              resolve(response)
            })
          })
      }
    })
  })

},getOffers:()=>{
  return new Promise((resolve,reject)=>{
    db.get().collection('categoryOffers').find().toArray().then((result)=>{
      // console.log(result)
      resolve(result)
    })
  }) 
},deleteCoffer:(category)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection("Products").find({category:category}).forEach(element => {
      element.price=parseInt(element.price)
      let offerPrice=element.price
      console.log(element.offerPrice)
      db.get().collection('Products').updateOne({_id:element._id},{$set:{offerPrice:offerPrice,catOffer:false}})
    },).then(()=>{
    db.get().collection('categoryOffers').removeOne({category:category}).then(()=>{
      resolve()
    })
  })})
},getOfferProducts: () => {
  return new Promise(async (resolve, reject) => {
    db.get().collection("Products").find().forEach(element => {
      if (element.offerPrice!=element.price){
        db.get().collection('Products').updateOne({_id:element._id},{$set:{OnOffer:true}})
      }
      else{
       
        db.get().collection('Products').updateOne({_id:element._id},{$set:{OnOffer:false}})
      }

    }).then(async ()=>{
      var Products = await db
      .get()
      .collection(collections.product)
      .find({OnOffer:true})
      .toArray();
      resolve(Products);
    })
   
    
  });
},decProQty:(products)=>{
  return new Promise((resolve,reject)=>{
products.forEach(element => {
 var quantity=-Math.abs(parseInt(element.quantity))
 console.log(quantity);
  db.get().collection('Products').updateOne({_id:ObjectId(element.CartProducts._id)},{
    $inc:{'quantity':quantity}
  }).then(()=>{
resolve()
  })
})})

},paymentCount:(payment)=>{
  return new Promise ((resolve,reject)=>{
    db.get().collection("order").find({paymentMethod:payment}).toArray().then((result)=>{
      result=result.length
      resolve(result)
    })
  })
 
}

  
};
