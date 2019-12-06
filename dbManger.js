const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jest = require('jest');


// Extend the default timeout so MongoDB binaries can download
// jest.setTimeout(60000);

// List your collection names here
const COLLECTIONS = [];
const promisifyGetCollections = function(db){
    return new Promise((resolve,reject)=>{

            const callback =(err,result) =>{
            if(err)
                reject(err);
            else{
                resolve(result);
            }
        }
        db.listCollections().toArray(callback);
    })
}


const promisifyInsertMany = function(db,collectionName,data){
    return  new Promise((resolve,reject)=>{

                const callback =(err,result) =>{
                if(err)
                    reject(err);
                else{
                    resolve(result.ops);
                }
            }
            db.collection(collectionName).insertMany(data,callback);
        });
}

const promisifyInsertOne = function(db,collectionName,data){
    return  new Promise((resolve,reject)=>{

                const callback =(err,result) =>{
                if(err)
                    reject(err);
                else{
                    resolve(result.ops);
                }
            }
            db.collection(collectionName).insertOne(data,callback);
        });
}

const promisifyFindAll = function(db,collectionName){
    return new Promise((resolve,reject)=>{

                const callback =(err,result) =>{
                if(err)
                    reject(err);
                else{
                    resolve(result);
                }
            }
            db.collection(collectionName).find({}).toArray(callback)
        });
}
const promisifyFind = function(db,collectionName,query){
    return new Promise((resolve,reject)=>{

                const callback =(err,result) =>{
                if(err)
                    reject(err);
                else{
                    resolve(result);
                }
            }
            // const query = { 
            //     laureates:{
            //         $elemMatch: { 
            //             firstname : {$regex : /^tom[a-zA-Z]*/ , $options: 'i'} ,
            //             surname : {$regex : /^lin[a-zA-Z]*/,$options : 'i'}
            //         } 
            //     }
            // };
            db.collection(collectionName).find(query).toArray(callback)
        });
}

const promisifyReadFile = function(fs,filename){
    return new Promise((resolve,reject)=>{

        const callback =(err,result) =>{
        if(err)
            reject(err);
        else{
            resolve(result);
        }
    }
    fs.readFile(filename,callback);
});
}



class DBManager {
  constructor() {
    this.db = null;
    this.server = new MongoMemoryServer();
    this.connection = null;
  }

  async start() {
    try{
        const url = await this.server.getConnectionString();
        this.connection = await MongoClient.connect(url, { useNewUrlParser: true });
        const dbName= await this.server.getDbName();
        this.db = await this.connection.db(dbName);
        // let res = await promisifyInsertOne(this.db,'user',{username:'ganesh',password:'1234'});
        // let collections = await promisifyGetCollections(this.db);
       // console.log(this.db);
    }
    catch(err){
        console.log(err);
    }
   
  }

  stop() {
    this.connection.close();
    return this.server.stop();
  }

  cleanup() {
    return Promise.all(COLLECTIONS.map(c => this.db.collection(c).remove({})));
  }
}

module.exports = {
    DBManager,
    promisifyInsertOne,
    promisifyInsertMany,
    promisifyFindAll,
    promisifyReadFile,
    promisifyFind
};