var express = require("express");
const { route } = require(".");
const products = require("../config/collection");
const productHelpers = require("../helpers/productHelpers");
const userHelpers = require("../helpers/userHelpers");
var router = express.Router();

/* GET login page. */

router.get("/", function (req, res, next) {
   res.render("admin/forms/login", { layout: "admin/forms/layout"});
});

/* To get dashboard */

router.get("/dashboard", async function (req, res, next) {
  let report=await productHelpers.getUsersCount()
  let sales= report.length
  let result= await productHelpers.getTotalSale()
  let purchases=result[0].total
  let purchaseAmount=result[0].totalcost
  let products= await productHelpers.getProductsCount()
  let graphData=await productHelpers.getYearlyReport()
  // console.log(graphData)
  let cod=await productHelpers.paymentCount("COD")
  let paypal=await productHelpers.paymentCount("Paypal")
  let razorpay=await productHelpers.paymentCount("razorpay")

  let pieChart=[cod,paypal,razorpay]
  console.log(pieChart)

  proCount=products.length
  res.render("admin/dashboard", { layout: "admin/layout",sales,purchases,purchaseAmount,proCount,graphData,pieChart});
});

// action to Dashboard page

router.post("/login", function (req, res, next) {
  userHelpers.adminLogin(req.body).then((result)=>{
    console.log(result)
    if(result){
    res.redirect("/admin/dashboard");}
    else{
      res.redirect("/admin")
    
    }
  })
  
});
module.exports = router;

/* To get user management */

router.get("/manageuser", function (req, res, next) {
  userHelpers.getAllUsers().then((users) => {
    console.log(users);
    res.render("admin/user-table", { layout: "admin/layout", users });
  });
});

// TO DELETE USER

router.get("/deleteuser/:id", (req, res) => {
  userHelpers.deleteuser(req.params.id).then((result) => {
    res.redirect("/admin/manageuser");
  });
});

// TO BLOCK USER
router.get("/blockuser/:id",
  (req, res) => {
    console.log(req.params.id)
      userHelpers.userStatus(req.params.id).then((result) => {
        res.redirect("/admin/manageuser");
      });
    } 
)
// ROUTE TO PRODUCT MANAGEMENT TABLE

router.get("/manageproduct", function (req, res, next) {
  productHelpers.getAllProducts().then((Products) => {
    console.log(Products);
    res.render("admin/product-table", {
      layout: "admin/layout",
      Products: Products,
    });
  });
});

//  ROUTE TO DELETE PRODUCT
router.get("/deleteproduct/:id", (req, res) => {
  productHelpers.deleteProduct(req.params.id).then((result) => {
    res.redirect("/admin/manageproduct");
  });
});

// ROUTE TO EDIT PRODUCT FORM

router.get("/editproductfrm/:id", function (req, res, next) {
  productHelpers.getProduct(req.params.id).then((product)=>{
    console.log(product)
    res.render("admin/forms/edit-product", {layout:"admin/forms/layout1",product});
  })
  
});

// ROUTE TO EDIT PRODUCT
router.post("/editproduct/:id", (req, res) => {
  productHelpers.editProduct(req.body,req.params.id).then( async (result) => {
    var id=req.params.id
    let file = req.files;
if (req.files==null){
  res.redirect("/admin/manageproduct");
}
else{
  if(req.files.image1){
    file.image1.mv(
      "./public/product-images/" + id + ".jpg",)
  }
  if(req.files.image2){
    file.image2.mv(
      "./public/product-images/" + id + "-1.jpg",)
  }
  if(req.files.image3){
    file.image3.mv(
      "./public/product-images/" + id + "-2.jpg",)
  }
  res.redirect("/admin/manageproduct");
}
    
   
  });
});

// TO GET ORDER MANAGEMENT TABLE

router.get("/manageorder", async function (req, res, next) {
  let orderDetails= await productHelpers.getAllOrders()
  console.log(orderDetails)

  res.render("admin/order-table", { layout: "admin/layout","data":req.session.user,orderDetails });
});

// ROUTE TO GET SALES REPORT

router.get("/salesreport",async function (req, res, next) {
  report=await productHelpers.getSaleProducts()
  console.log(report)
  
  res.render("admin/sales-report", { layout:false,report });
});

// TO SEARCH ON SALES REPORT
router.post("/reportSearch",async (req,res)=>{
 
  var start = new Date(req.body.searchStart);
var end = new Date(req.body.searchEnd);
console.log(start,end)
report=await productHelpers.salesSearch(start,end)
  res.render("admin/sales-report", { layout: false,report });
})

// ACTION TO SALES REPORT BUTTON

router.get("/salesFilter",async (req,res)=>{
  var day,report
  if(req.query.value==1){
     report=await productHelpers.getTodaySale()
     console.log("succ")
  }
  else{
  if(req.query.value==7){
    day=7
  }
  else if(req.query.value==30){
  day=30
  }
  report=await productHelpers.getFilterResults(day)
}


res.render("admin/sales-report", { layout: false,report });
})

//ROUTE TO ADD PRODUCT FORM

router.get("/productfrm",async function (req, res, next) {
  let category=await productHelpers.getCategories()
  res.render("admin/forms/add-product", { layout: "admin/layout",category});
});

//ROUTE TO ADD PRODUCT ACTION

router.post("/addproduct", function (req, res, next) {
  productHelpers.addProduct(req.body, async (id) => {
    console.log("product added");
    let file = req.files;

    console.log(file);
    await file.image1.mv(
      "./public/product-images/" + id + ".jpg",
      (err, done) => {
        if (err) {
          console.log("error");
        }
      }
    );
    await file.image2.mv(
      "./public/product-images/" + id + "-1.jpg",
      (err, done) => {
        if (err) {
          console.log("error");
        } else {
          console.log("");
        }
      }
    );
    await file.image3.mv(
      "./public/product-images/" + id + "-2.jpg",
      (err, done) => {
        if (!err) {
          res.redirect("/admin/productfrm");
        } else {
          console.log("move error");
        }
      }
    );
  });
});

// TO CANCEL ORDER FROM ADMIN
router.get("/cancelOrder/:id",
  (req, res) => {
      productHelpers.cancelOrder(req.params.id).then((result) => {
        res.redirect("/admin/manageorder");
      });
    } 
)

// ROUTE TO THE CATEGORY MANAGEMENT


router.get("/categoryManage",async function (req, res, next) {
let category=await productHelpers.getCategories()
// console.log(category)
  res.render("admin/category-management", { layout: "admin/layout",category });
});

// ROUTE TO ADD CATEGORY FORM

router.get("/addcategoryFrm", function (req, res, next) {

  res.render("admin/forms/add-category", { layout: "admin/layout" ,"catexist":req.session.category});
  
});

// ROUTE TO ADD CATEGORY ACTION
router.post("/addCategory", function (req, res, next) {
  productHelpers.addCategory(req.body ).then((result)=>{
    // req.session.category=false
    res.redirect('/admin/addcategoryFrm')
  }).catch(()=>{
    req.session.category=true
    res.redirect('/admin/addcategoryFrm')
  })

  res.render("admin/forms/add-category", { layout: "admin/layout" });
});
// ROUTE TO DELETE CATEGORY
router.get("/deleteCategory/:id", function (req, res, next) {
  productHelpers.deleteCategory(req.params.id).then(()=>{
    res.redirect("/admin/categoryManage");

  })

})

// ROUTE TO ADD BRAND FORM
router.get("/addBrandFrm/:id", function (req, res, next) {
  res.render("admin/forms/add-brand", { layout: "admin/forms/layout1",id:req.params.id });
})
// ROUTE TO ADD BRAND ACTION
router.post("/addBrand", function (req, res, next) {
  productHelpers.addBrand(req.body).then(()=>{
    res.render("admin/forms/add-brand", { layout: "admin/forms/layout1",id:req.body.id });
  })

})

// ROUTE TO REMOVE BRAND FORM

router.get("/removeBrandFrm/:id",async function (req, res, next) {
  let category=await productHelpers.getCategory(req.params.id)
  console.log(category) 
res.render("admin/forms/remove-brand", { layout: "admin/forms/layout1",category,id:req.params.id });
});

// ROUTE TO REMOVE BRAND ACTION 

router.post("/removeBrand", function (req, res, next) {
  productHelpers.removeBrand(req.body).then(async()=>{
    let category=await productHelpers.getCategory(req.body.id)
    res.render("admin/forms/remove-brand", { layout: "admin/forms/layout1",category,id:req.body.id });
   
  })

})
// ROUTE TO GET BRAND

router.post("/getBrand", function (req, res, next) {
  userHelpers.getBrand(req.body).then((response) => {
    // console.log(response)
    let obj = response;
    res.json(obj);
  });
  // res.render('addresses',{"data":req.session.user});
});
// ROUTE TO OFFER MANAGEMENT TABLE

router.get('/manageOffers',async(req,res)=>{
  let offers=await productHelpers.getOffers()
  res.render("admin/category-offers",{layout:'admin/layout',offers})
})

// ROUTE TO ADD CATEGORY OFFER FORM
router.get('/addCofferFrm',async(req,res)=>{
  let category=await productHelpers.getCategories()
  res.render("admin/forms/add-offer",{layout:'admin/layout',exist:req.session.Oexist,category})
  req.session.Oexist=false
})
// ROUTE TO  THE ACTION ADD OFFERS FOR CATEGORY

router.post('/addCoffers',(req,res)=>{
  productHelpers.addCoffers(req.body).then((response)=>{
    if(response.exist){
      req.session.Oexist=true
    }
    res.redirect('/admin/addCofferFrm')
  })
})
// ROUTE TO DELETE A CATEGORY OFFER
router.get('/deleteCoffer/:category',(req,res)=>{
productHelpers.deleteCoffer(req.params.category).then(()=>{
  res.redirect('/admin/manageOffers')
})
})

// ROUTE TO COUPON MANAGEMENT

router.get('/manageCoupons',(req,res)=>{
  productHelpers.getAllCoupons().then((coupons)=>{
    res.render("admin/coupon-table",{layout:'admin/layout',coupons})
    
  })
  
})
// ROUTE TO ADD COUPON FORM

router.get('/addCouponFrm',(req,res)=>{
  productHelpers.getAllCoupons().then((coupons)=>{
    res.render("admin/forms/add-coupon",{layout:'admin/layout',exist:req.session.Cexist,coupons})
    req.session.Cexist=false
  })
 
})
  

// ROUTE TO ACTION OF ADD COUPON

router.post('/addCoupon',(req,res)=>{
  productHelpers.addCoupon(req.body).then((response)=>{
    if(response.exist){
      req.session.Cexist=true
    }
    res.redirect('/admin/addCouponFrm')
  })
})
// ROUTE TO DELETE COUPON
router.get('/deleteCoupon/:id',(req,res)=>{
  productHelpers.deleteCoupon(req.params.id).then(()=>{
   
    res.redirect('/admin/manageCoupons')
  })
})


