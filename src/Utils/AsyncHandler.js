const AsyncHandler = (RequestHandlerFn)=>{
   return (res,req,next)=>{
        Promise.resolve(RequestHandlerFn(res,req,next)).catch((err)=>next(err))
    }
}

export {AsyncHandler}