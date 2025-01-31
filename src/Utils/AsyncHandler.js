const AsyncHandler = (RequestHandlerFn)=>{
   return (req,res,next)=>{
        Promise.resolve(RequestHandlerFn(req,res,next)).catch((err)=>next(err))
    }
}

export {AsyncHandler}