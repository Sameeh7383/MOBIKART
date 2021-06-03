function changeQuantity(cartId,productId,count){
    let quantity=parseInt(document.getElementById(productId).innerHTML)
    count=parseInt(count)
    $.ajax({
        url:'/change-cart-quantity',
        data:{
            cart:cartId,
            product:productId,
            count:count,
            quantity:quantity
        },
        method:"post",
        success:(response)=>{
            if(response.removeProduct){
                alert("The product has been removed")
                location.reload()
            }else{
                document.getElementById(productId).innerHTML=quantity+count
            }
        }
    })
}

