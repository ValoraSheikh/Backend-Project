import mongoose from 'mongoose';
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log(`\n Mongo DB connected !! DB HOST: ${connectionInstance.connection.host}`);
    
  } catch (error) {
    console.log(`Error in connecting DB`, error);
    process.exit(1)
    // throw error
    
  }
}

export default connectDB;