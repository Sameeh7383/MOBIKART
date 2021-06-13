const MongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect= function (done){
<<<<<<< HEAD
    const url= 'mongodb+srv://mobikart1:mobi123@cluster0.f0psh.mongodb.net/test?retryWrites=true&w=majority'
   
=======
    const url= "mongodb+srv://mobikart1:mobi123@cluster0.f0psh.mongodb.net/test?retryWrites=true&w=majority"
>>>>>>> 6151d3eae8d3677d64986a15161d8f25c15ae142
    const dbname= 'mobikart'
    MongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}
module.exports.get= function(){
    return state.db
}
